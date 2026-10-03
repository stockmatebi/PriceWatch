from pathlib import Path
import math
import wave
import struct
import re

root = Path("android")
pkg = root / "app/src/main/java/com/pricewatchnative"
pkg.mkdir(parents=True, exist_ok=True)

receiver = r'''package com.pricewatchnative

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONArray
import org.json.JSONObject

object PriceWatchNotifications {
    private const val CHANNEL_ID = "price_watch_alerts_v3"
    private const val PREFS = "price_watch_notifications"
    private const val LAST_ALERT = "last_alert_seen"
    private const val LAST_PROMO = "last_promotion_seen"
    private const val ACTION_CHECK = "com.pricewatchnative.CHECK_NOTIFICATIONS"
    private const val INTERVAL_MS = 15L * 60L * 1000L
    private const val SUPABASE_URL = "https://iymwzyxlvtyidebxdzyw.supabase.co"
    private const val SUPABASE_KEY = "sb_publishable_7_ms0zNP3-ZEX8tDJtyvWw_jqTMs0AP"

    fun start(context: Context) {
        createChannel(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, PriceWatchNotificationReceiver::class.java).setAction(ACTION_CHECK)
        val pending = PendingIntent.getBroadcast(context, 7711, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        alarmManager.cancel(pending)
        alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + 30_000L, INTERVAL_MS, pending)
        // Check immediately when the app is opened so existing alerts are not delayed.
        Thread { check(context.applicationContext) }.start()
    }

    fun handle(context: Context, action: String?) {
        createChannel(context)
        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            start(context)
            return
        }
        Thread { check(context.applicationContext) }.start()
    }

    private fun check(context: Context) {
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val alerts = getJson("$SUPABASE_URL/rest/v1/pw_alerts?select=id,old_price,new_price,percentage_change,detected_at,source_url,alert_type&alert_type=eq.price_change&order=detected_at.desc&limit=10")
            val promos = getJson("$SUPABASE_URL/rest/v1/pw_promotions?select=id,supplier_id,title,text,post_url,detected_at,is_promotion&is_promotion=eq.true&order=detected_at.desc&limit=10")
            val lastAlert = prefs.getString(LAST_ALERT, null)
            val lastPromo = prefs.getString(LAST_PROMO, null)

            if (lastAlert == null) {
                // Do not silently discard existing alerts on first launch.
                alerts.reversedItems().forEach { notifyPriceChange(context, it) }
                alerts.maxTimestamp()?.let { prefs.edit().putString(LAST_ALERT, it).apply() }
            } else {
                alerts.newerThan(lastAlert).asReversed().forEach { notifyPriceChange(context, it) }
                alerts.maxTimestamp()?.let { if (it > lastAlert) prefs.edit().putString(LAST_ALERT, it).apply() }
            }

            if (lastPromo == null) {
                // Also surface promotions that were detected before this install.
                promos.reversedItems().forEach { notifyPromotion(context, it) }
                promos.maxTimestamp()?.let { prefs.edit().putString(LAST_PROMO, it).apply() }
            } else {
                promos.newerThan(lastPromo).asReversed().forEach { notifyPromotion(context, it) }
                promos.maxTimestamp()?.let { if (it > lastPromo) prefs.edit().putString(LAST_PROMO, it).apply() }
            }
        } catch (_: Exception) {
        }
    }

    private fun getJson(url: String): JSONArray {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 12_000
        connection.readTimeout = 12_000
        connection.setRequestProperty("apikey", SUPABASE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $SUPABASE_KEY")
        connection.setRequestProperty("Accept", "application/json")
        return try {
            if (connection.responseCode in 200..299) JSONArray(connection.inputStream.bufferedReader().use { it.readText() }) else JSONArray()
        } finally { connection.disconnect() }
    }

    private fun JSONArray.maxTimestamp(): String? {
        var max: String? = null
        for (i in 0 until length()) {
            val value = optJSONObject(i)?.optString("detected_at", "") ?: ""
            if (value.isNotEmpty() && (max == null || value > max!!)) max = value
        }
        return max
    }

    private fun JSONArray.reversedItems(): List<JSONObject> {
        val out = mutableListOf<JSONObject>()
        for (i in length() - 1 downTo 0) {
            val obj = optJSONObject(i) ?: continue
            out.add(obj)
        }
        return out
    }

    private fun JSONArray.newerThan(timestamp: String): List<JSONObject> {
        val out = mutableListOf<JSONObject>()
        for (i in 0 until length()) {
            val obj = optJSONObject(i) ?: continue
            val value = obj.optString("detected_at", "")
            if (value.isNotEmpty() && value > timestamp) out.add(obj)
        }
        return out
    }

    private fun notifyPriceChange(context: Context, row: JSONObject) {
        val oldPrice = row.optDouble("old_price", Double.NaN)
        val newPrice = row.optDouble("new_price", Double.NaN)
        val pct = row.optDouble("percentage_change", Double.NaN)
        val direction = if (!oldPrice.isNaN() && !newPrice.isNaN() && newPrice > oldPrice) "increased" else "changed"
        val price = if (newPrice.isNaN()) "" else "R%.2f".format(java.util.Locale.US, newPrice)
        val change = if (pct.isNaN()) "" else " (%+.1f%%)".format(java.util.Locale.US, pct)
        post(context, "Price Watch", "Competitor price $direction: $price$change", row.optString("source_url", null), row.optString("id"))
    }

    private fun notifyPromotion(context: Context, row: JSONObject) {
        val title = row.optString("title").ifBlank { "New supplier promotion" }
        val text = row.optString("text").ifBlank { "A new promotion was detected." }
        post(context, title, text.take(180), row.optString("post_url", null), row.optString("id"))
    }

    private fun post(context: Context, title: String, body: String, url: String?, id: String) {
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val launch = if (!url.isNullOrBlank()) {
            Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        } else {
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
        }
        val pending = PendingIntent.getActivity(context, id.hashCode(), launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()
        NotificationManagerCompat.from(context).notify(id.hashCode(), notification)
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val sound = Uri.parse("android.resource://${context.packageName}/raw/price_watch_alert")
        val audio = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
        val channel = NotificationChannel(CHANNEL_ID, "Price Watch alerts", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Price changes and new supplier promotions"
            setSound(sound, audio)
            enableVibration(true)
        }
        manager.createNotificationChannel(channel)
    }
}

class PriceWatchNotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        PriceWatchNotifications.handle(context, intent.action)
    }
}
'''

(pkg / "PriceWatchNotificationReceiver.kt").write_text(receiver)

manifest = root / "app/src/main/AndroidManifest.xml"
s = manifest.read_text()
perm = '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n'
if 'android.permission.POST_NOTIFICATIONS' not in s:
    s = s.replace('<manifest', '<manifest', 1)
    s = s.replace('    <uses-permission android:name="android.permission.INTERNET" />\n', '    <uses-permission android:name="android.permission.INTERNET" />\n' + perm)
receiver_xml = '''        <receiver
            android:name=".PriceWatchNotificationReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>
'''
if 'PriceWatchNotificationReceiver' not in s:
    s = s.replace('</application>', receiver_xml + '    </application>')
manifest.write_text(s)

main = pkg / "MainActivity.kt"
s = main.read_text()
imports = 'import android.Manifest\nimport android.content.pm.PackageManager\nimport android.os.Build\nimport android.os.Bundle\nimport androidx.core.app.ActivityCompat\n'
if 'import android.Manifest' not in s:
    marker = 'package com.pricewatchnative\n'
    s = s.replace(marker, marker + '\n' + imports)
if 'PriceWatchNotifications.start(this)' not in s:
    marker = 'class MainActivity : ReactActivity() {\n'
    method = '''class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        PriceWatchNotifications.start(this)
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 7001)
        }
    }

'''
    if marker not in s:
        raise SystemExit('MainActivity class marker not found')
    s = s.replace(marker, method, 1)
main.write_text(s)

raw = root / "app/src/main/res/raw"
raw.mkdir(parents=True, exist_ok=True)
sound = raw / "price_watch_alert.wav"
rate = 44100
notes = [(880, 0.10), (1175, 0.10), (1568, 0.16)]
frames = bytearray()
for freq, duration in notes:
    count = int(rate * duration)
    for n in range(count):
        t = n / rate
        envelope = min(1.0, n / (rate * 0.01), (count - n) / (rate * 0.02))
        sample = int(0.28 * envelope * 32767 * math.sin(2 * math.pi * freq * t))
        frames += struct.pack('<h', sample)
with wave.open(str(sound), 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(rate)
    wf.writeframes(frames)

print("Native Price Watch notifications installed")
