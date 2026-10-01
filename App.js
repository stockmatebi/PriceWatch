import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {supabase} from './lib/supabase';

const money = value => (value == null ? '—' : `R${Number(value).toFixed(2)}`);

const timeLabel = value => {
  if (!value) return 'Not checked';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not checked';
  return date.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const dateKey = value => (value ? String(value).slice(0, 10) : null);

const formatDateOnly = value => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-ZA', {day: '2-digit', month: 'short', year: 'numeric'});
};

const getPromotionStatus = promotion => {
  if (!promotion) return null;
  const today = new Date().toISOString().slice(0, 10);
  const from = dateKey(promotion.valid_from);
  const until = dateKey(promotion.valid_until);

  if (from && today < from) {
    return {key: 'outside', label: 'NOT YET VALID', color: '#ff7777', background: '#351f1f'};
  }
  if (until && today > until) {
    return {key: 'expired', label: 'SPECIAL EXPIRED', color: '#ff7777', background: '#351f1f'};
  }
  if (from || until) {
    const range = from && until
      ? `Valid ${formatDateOnly(from)}–${formatDateOnly(until)}`
      : until
        ? `Valid until ${formatDateOnly(until)}`
        : `Valid from ${formatDateOnly(from)}`;
    return {key: 'valid', label: 'SPECIAL VALID', detail: range, color: '#57d58a', background: '#183022'};
  }
  return {key: 'unknown', label: 'VALIDITY UNKNOWN', color: '#F5BE28', background: '#332c18'};
};

const changePct = (current, previous) => {
  if (current == null || previous == null || Number(previous) === 0) return null;
  return ((Number(current) - Number(previous)) / Number(previous)) * 100;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PriceWatchApp />
    </SafeAreaProvider>
  );
}

function PriceWatchApp() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('dashboard');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    const [supplierResult, productResult, snapshotResult, promotionResult, alertResult, runResult] =
      await Promise.all([
        supabase.from('pw_suppliers').select('id,name,location,website_url').eq('active', true).order('name'),
        supabase.from('pw_products').select('id,name,category,unit').eq('active', true).order('name'),
        supabase
          .from('pw_price_snapshots')
          .select('id,supplier_id,product_id,price,promotion_text,source_url,source_type,confidence,checked_at')
          .order('checked_at', {ascending: false})
          .limit(500),
        supabase
          .from('pw_promotions')
          .select('id,supplier_id,platform,title,text,image_url,post_url,posted_at,detected_at,ai_summary,ai_extraction,is_promotion,confidence,valid_from,valid_until,validity_type,validity_text,validity_confidence')
          .eq('is_promotion', true)
          .order('detected_at', {ascending: false})
          .limit(50),
        supabase
          .from('pw_alerts')
          .select('id,supplier_id,product_id,old_price,new_price,percentage_change,source_url,alert_type,detected_at')
          .eq('alert_type', 'price_change')
          .order('detected_at', {ascending: false})
          .limit(30),
        supabase
          .from('pw_check_runs')
          .select('id,started_at,finished_at,status,checked_count,updated_count,error_count,results')
          .order('started_at', {ascending: false})
          .limit(1),
      ]);

    const firstError =
      supplierResult.error ||
      productResult.error ||
      snapshotResult.error ||
      promotionResult.error ||
      alertResult.error ||
      runResult.error;

    if (firstError) {
      setError(firstError.message || 'Could not load Price Watch data.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setSuppliers(supplierResult.data || []);
    setProducts(productResult.data || []);
    setSnapshots(snapshotResult.data || []);
    setPromotions(promotionResult.data || []);
    setAlerts(alertResult.data || []);
    setLatestRun(runResult.data?.[0] || null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const historyByKey = useMemo(() => {
    const map = new Map();
    for (const row of snapshots) {
      const key = `${row.supplier_id}|${row.product_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return map;
  }, [snapshots]);

  const latest = useMemo(() => {
    const map = new Map();
    for (const [key, rows] of historyByKey.entries()) {
      map.set(key, rows[0]);
    }
    return map;
  }, [historyByKey]);

  const previous = useMemo(() => {
    const map = new Map();
    for (const [key, rows] of historyByKey.entries()) {
      if (rows[1]) map.set(key, rows[1]);
    }
    return map;
  }, [historyByKey]);

  const lastChecked = snapshots[0]?.checked_at || null;

  const openUrl = url => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const promotionForRow = row => {
    if (!row || row.source_type !== 'facebook' || !row.source_url) return null;
    return promotions.find(promotion => promotion.supplier_id === row.supplier_id && promotion.post_url === row.source_url) || null;
  };

  const priceStatusForRow = row => getPromotionStatus(promotionForRow(row));

  const priceChange = (supplierId, productId) =>
    changePct(
      latest.get(`${supplierId}|${productId}`)?.price,
      previous.get(`${supplierId}|${productId}`)?.price,
    );

  const renderChange = (value, compact = false) => {
    if (value == null) {
      return <Text style={styles.noChange}>{compact ? 'No previous price' : 'No change history yet'}</Text>;
    }
    const up = value > 0;
    const down = value < 0;
    return (
      <Text style={[styles.change, up && styles.changeUp, down && styles.changeDown]}>
        {up ? '▲ ' : down ? '▼ ' : ''}{Math.abs(value).toFixed(1)}%
      </Text>
    );
  };

  const renderDashboard = () => {
    const changed = alerts.map(alert => ({
      alert,
      product: products.find(product => product.id === alert.product_id),
      supplier: suppliers.find(supplier => supplier.id === alert.supplier_id),
    })).filter(item => item.product && item.supplier);

    return (
      <>
        <View style={styles.hero}>
          <View style={{flex: 1}}>
            <Text style={styles.eyebrow}>LIVE MONITORING</Text>
            <Text style={styles.heroTitle}>PriceWatch</Text>
            <Text style={styles.heroText}>Competitor prices monitored from configured sources.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => { setRefreshing(true); loadData(); }}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusDot} />
          <View style={{flex: 1}}>
            <Text style={styles.statusTitle}>Monitoring online</Text>
            <Text style={styles.statusText}>Last data received: {timeLabel(lastChecked)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={products.length} label="Products" />
          <StatCard value={suppliers.length} label="Suppliers" />
          <StatCard value={latest.size} label="Live prices" />
        </View>

        <Text style={styles.sectionTitle}>Current prices</Text>
        {products.map(product => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.unit}>{product.unit}</Text>
            {suppliers.map(supplier => {
              const row = latest.get(`${supplier.id}|${product.id}`);
              const pct = priceChange(supplier.id, product.id);
              return (
                <View key={supplier.id} style={styles.priceRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    <Text style={styles.checked}>{timeLabel(row?.checked_at)}</Text>
                  </View>
                  <View style={styles.priceRight}>
                    <Text style={styles.price}>{money(row?.price)}</Text>
                    {(() => {
                      const status = priceStatusForRow(row);
                      return status ? (
                        <View style={[styles.validityBadge, {backgroundColor: status.background}]}>
                          <Text style={[styles.validityBadgeText, {color: status.color}]}>{status.label}</Text>
                        </View>
                      ) : null;
                    })()}
                    {renderChange(pct, true)}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Supplier monitoring status</Text>
        {suppliers.map(supplier => {
          const results = Array.isArray(latestRun?.results) ? latestRun.results.filter(result => result.supplier === supplier.name) : [];
          const hasError = results.some(result => result.status === 'error');
          const hasPrice = results.some(result => ['updated', 'price_changed', 'initial_price', 'unchanged'].includes(result.status));
          const hasNotFound = results.some(result => result.status === 'price_not_found');
          const status = hasError ? 'ERROR' : hasPrice ? 'PRICE FOUND' : hasNotFound ? 'CHECKED · NO PRICE FOUND' : 'NO SOURCE CONFIGURED';
          const statusStyle = hasError ? styles.monitorError : hasPrice ? styles.monitorGood : styles.monitorWarn;
          return (
            <View key={supplier.id} style={styles.monitorRow}>
              <View style={{flex: 1}}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.checked}>{results.length ? timeLabel(latestRun?.finished_at) : 'Not checked'}</Text>
              </View>
              <Text style={statusStyle}>{status}</Text>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Recent price changes</Text>
        {changed.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No recorded price changes yet</Text>
            <Text style={styles.emptyText}>A change will appear here after a supplier price moves between checks.</Text>
          </View>
        ) : changed.slice(0, 8).map(item => (
          <View key={item.alert.id} style={styles.changeCard}>
            <View style={{flex: 1}}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <Text style={styles.unit}>{item.supplier.name} · {timeLabel(item.alert.detected_at)}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.price}>{money(item.alert.new_price)}</Text>
              <Text style={[styles.change, Number(item.alert.percentage_change) > 0 ? styles.changeUp : styles.changeDown]}>
                {Number(item.alert.percentage_change) > 0 ? '▲ ' : '▼ '}{Math.abs(Number(item.alert.percentage_change)).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderCompare = () => (
    <>
      <Text style={styles.sectionTitle}>Supplier comparison</Text>
      <Text style={styles.pageIntro}>Current prices side-by-side. Lowest available price is highlighted.</Text>
      {products.map(product => {
        const rows = suppliers
          .map(supplier => ({supplier, row: latest.get(`${supplier.id}|${product.id}`)}))
          .filter(item => item.row?.price != null)
          .sort((a, b) => Number(a.row.price) - Number(b.row.price));
        const lowest = rows[0]?.row?.price;
        return (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.unit}>{product.unit}</Text>
            {rows.length === 0 ? (
              <Text style={styles.noData}>No current prices available.</Text>
            ) : rows.map((item, index) => (
              <View key={item.supplier.id} style={styles.compareRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.supplierName}>{item.supplier.name}</Text>
                  <Text style={styles.checked}>{timeLabel(item.row.checked_at)}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={[styles.price, Number(item.row.price) === Number(lowest) && styles.lowestPrice]}>
                    {money(item.row.price)}
                  </Text>
                  {(() => {
                    const status = priceStatusForRow(item.row);
                    return status ? (
                      <View style={[styles.validityBadge, {backgroundColor: status.background}]}>
                        <Text style={[styles.validityBadgeText, {color: status.color}]}>{status.label}</Text>
                      </View>
                    ) : null;
                  })()}
                  {Number(item.row.price) === Number(lowest) && <Text style={styles.lowestLabel}>LOWEST AVAILABLE</Text>}
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </>
  );

  const renderHistory = () => (
    <>
      <Text style={styles.sectionTitle}>Price history</Text>
      <Text style={styles.pageIntro}>Recent recorded prices, newest first.</Text>
      {products.map(product => {
        const entries = [];
        for (const supplier of suppliers) {
          const rows = historyByKey.get(`${supplier.id}|${product.id}`) || [];
          rows.slice(0, 8).forEach(row => entries.push({row, supplier}));
        }
        entries.sort((a, b) => new Date(b.row.checked_at) - new Date(a.row.checked_at));
        return (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.unit}>{product.unit}</Text>
            {entries.length === 0 ? (
              <Text style={styles.noData}>No history available yet.</Text>
            ) : entries.slice(0, 12).map((entry, index) => (
              <View key={entry.row.id || index} style={styles.historyRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.supplierName}>{entry.supplier.name}</Text>
                  <Text style={styles.checked}>{timeLabel(entry.row.checked_at)}</Text>
                </View>
                <Text style={styles.price}>{money(entry.row.price)}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </>
  );

  const renderProducts = () => (
    <>
      <Text style={styles.sectionTitle}>Monitored products</Text>
      {products.map(product => (
        <View key={product.id} style={styles.simpleCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.unit}>{product.category} · {product.unit}</Text>
          <Text style={styles.smallText}>Tracked across {suppliers.length} suppliers</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Suppliers</Text>
      {suppliers.map(supplier => (
        <View key={supplier.id} style={styles.simpleCard}>
          <Text style={styles.productName}>{supplier.name}</Text>
          <Text style={styles.unit}>{supplier.location || 'Howick'}</Text>
          {supplier.website_url ? (
            <TouchableOpacity onPress={() => openUrl(supplier.website_url)}>
              <Text style={styles.link}>Open supplier website</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </>
  );

  const renderPromotions = () => (
    <>
      <Text style={styles.sectionTitle}>Promotions</Text>
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Promotion price status</Text>
        <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: '#57d58a'}]} /><Text style={styles.legendText}>GREEN · Promotion is currently within its stated validity period</Text></View>
        <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: '#ff7777'}]} /><Text style={styles.legendText}>RED · Promotion period has passed or is outside the stated dates</Text></View>
        <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: '#F5BE28'}]} /><Text style={styles.legendText}>AMBER · No clear validity period was detected</Text></View>
      </View>
      {promotions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No promotions detected yet</Text>
          <Text style={styles.emptyText}>Promotion records will appear here when social monitoring starts detecting relevant supplier posts.</Text>
        </View>
      ) : promotions.map(promotion => (
        <View key={promotion.id} style={styles.simpleCard}>
          <Text style={styles.productName}>{suppliers.find(s => s.id === promotion.supplier_id)?.name || 'Supplier promotion'}</Text>
          <Text style={styles.unit}>{promotion.platform || 'Source'} · {timeLabel(promotion.posted_at || promotion.detected_at)}</Text>
          <Text style={styles.smallText}>{promotion.ai_summary || promotion.title || promotion.text || 'Promotion detected.'}</Text>
          {Array.isArray(promotion.ai_extraction?.items) && promotion.ai_extraction.items.length > 0 ? (
            <View style={styles.promotionItems}>
              {promotion.ai_extraction.items.map((item, index) => (
                <View key={index} style={styles.promotionItemRow}>
                  <Text style={styles.promotionItemName}>{item.product_name || 'Special'}</Text>
                  <Text style={styles.promotionItemPrice}>{item.price != null ? money(item.price) : 'Price not stated'}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {(() => {
            const status = getPromotionStatus(promotion);
            return status ? (
              <View style={[styles.promotionStatusCard, {backgroundColor: status.background}]}>
                <Text style={[styles.promotionStatusTitle, {color: status.color}]}>{status.label}</Text>
                <Text style={[styles.promotionStatusText, {color: status.color}]}>
                  {status.detail || promotion.validity_text || 'The promotion validity could not be established from the post.'}
                </Text>
              </View>
            ) : null;
          })()}
          {promotion.post_url ? (
            <TouchableOpacity onPress={() => openUrl(promotion.post_url)}>
              <Text style={styles.link}>View original promotion</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </>
  );

  const tabTitle = {dashboard: 'Dashboard', compare: 'Compare', history: 'History', products: 'Products', promotions: 'Promotions'}[tab];

  return (
    <View style={[styles.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />
      <View style={styles.container}>
        <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>PW</Text>
            </View>
            <View>
              <Text style={styles.logo}>PriceWatch</Text>
              <Text style={styles.topSubtitle}>{tabTitle} · Competitor intelligence</Text>
            </View>
          </View>
          <View style={styles.livePill}>
            <View style={styles.statusDotSmall} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#F5BE28" />
            <Text style={styles.loadingText}>Loading live prices…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Connection problem</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadData(); }}
                tintColor="#F5BE28"
              />
            }>
            {tab === 'dashboard' && renderDashboard()}
            {tab === 'compare' && renderCompare()}
            {tab === 'history' && renderHistory()}
            {tab === 'products' && renderProducts()}
            {tab === 'promotions' && renderPromotions()}
          </ScrollView>
        )}

        <View style={styles.nav}>
          <NavButton label="Dashboard" active={tab === 'dashboard'} onPress={() => setTab('dashboard')} />
          <NavButton label="Compare" active={tab === 'compare'} onPress={() => setTab('compare')} />
          <NavButton label="History" active={tab === 'history'} onPress={() => setTab('history')} />
          <NavButton label="Products" active={tab === 'products'} onPress={() => setTab('products')} />
          <NavButton label="Promotions" active={tab === 'promotions'} onPress={() => setTab('promotions')} />
        </View>
      </View>
    </View>
  );
}

function StatCard({value, label}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NavButton({label, active, onPress}) {
  return (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      <Text numberOfLines={1} style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#121417'},
  container: {flex: 1, backgroundColor: '#121417'},
  topBar: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#252a31'},
  brandBlock: {flexDirection: 'row', alignItems: 'center'},
  logoMark: {width: 34, height: 34, borderRadius: 9, backgroundColor: '#F5BE28', alignItems: 'center', justifyContent: 'center', marginRight: 9},
  logoMarkText: {fontSize: 12, fontWeight: '900', color: '#121417', letterSpacing: 0.5},
  logo: {fontSize: 20, fontWeight: '900', color: '#F5BE28', letterSpacing: 0.5},
  topSubtitle: {fontSize: 11, color: '#8e969f', marginTop: 3},
  livePill: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d2127', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7},
  statusDotSmall: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#57c878', marginRight: 6},
  liveText: {fontSize: 11, fontWeight: '800', color: '#dce2e7'},
  scroll: {flex: 1},
  content: {padding: 14, paddingBottom: 26},
  hero: {padding: 17, borderRadius: 18, backgroundColor: '#1d2127', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  eyebrow: {fontSize: 10, fontWeight: '800', color: '#F5BE28', letterSpacing: 1.3},
  heroTitle: {fontSize: 27, fontWeight: '800', color: '#fff', marginTop: 5},
  heroText: {fontSize: 13, color: '#aeb4bc', marginTop: 4, maxWidth: 230},
  refreshButton: {backgroundColor: '#F5BE28', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginLeft: 10},
  refreshText: {fontSize: 12, fontWeight: '800', color: '#121417'},
  statusCard: {marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: '#18231d', flexDirection: 'row', alignItems: 'center'},
  statusDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: '#57c878', marginRight: 10},
  statusTitle: {fontSize: 14, fontWeight: '800', color: '#e7f6eb'},
  statusText: {fontSize: 12, color: '#a9b7ae', marginTop: 2},
  statsRow: {flexDirection: 'row', gap: 8, marginTop: 12},
  statCard: {flex: 1, backgroundColor: '#1d2127', borderRadius: 13, padding: 12},
  statValue: {fontSize: 21, fontWeight: '900', color: '#F5BE28'},
  statLabel: {fontSize: 10, color: '#8f98a1', marginTop: 3},
  sectionTitle: {fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 22, marginBottom: 8},
  pageIntro: {fontSize: 13, color: '#9da5ad', lineHeight: 19, marginBottom: 10},
  productCard: {backgroundColor: '#1d2127', borderRadius: 16, padding: 15, marginBottom: 12},
  productName: {fontSize: 16, fontWeight: '800', color: '#fff'},
  unit: {fontSize: 12, color: '#8f98a1', marginTop: 3},
  priceRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#2a2f36', marginTop: 9},
  supplierName: {fontSize: 13, fontWeight: '700', color: '#dce1e6'},
  checked: {fontSize: 10, color: '#7f8790', marginTop: 2},
  priceRight: {alignItems: 'flex-end', marginLeft: 10},
  price: {fontSize: 18, fontWeight: '900', color: '#F5BE28'},
  change: {fontSize: 10, fontWeight: '900', color: '#9da5ad', marginTop: 2},
  changeUp: {color: '#ff7777'},
  changeDown: {color: '#57d58a'},
  noChange: {fontSize: 10, color: '#777f87', marginTop: 3},
  changeCard: {backgroundColor: '#1d2127', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center'},
  compareRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#2a2f36', marginTop: 8},
  lowestPrice: {color: '#57d58a'},
  lowestLabel: {fontSize: 8, fontWeight: '900', color: '#57d58a', marginTop: 2},
  monitorRow: {backgroundColor: '#1d2127', borderRadius: 13, padding: 13, marginBottom: 7, flexDirection: 'row', alignItems: 'center'},
  monitorGood: {fontSize: 9, fontWeight: '900', color: '#57d58a', textAlign: 'right'},
  monitorWarn: {fontSize: 9, fontWeight: '900', color: '#F5BE28', textAlign: 'right'},
  monitorError: {fontSize: 9, fontWeight: '900', color: '#ff7777', textAlign: 'right'},
  historyRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2a2f36', marginTop: 7},
  simpleCard: {backgroundColor: '#1d2127', borderRadius: 15, padding: 16, marginBottom: 10},
  smallText: {fontSize: 13, lineHeight: 19, color: '#b8bec5', marginTop: 10},
  link: {fontSize: 13, fontWeight: '800', color: '#F5BE28', marginTop: 12},
  emptyCard: {backgroundColor: '#1d2127', borderRadius: 15, padding: 18, marginTop: 4},
  emptyTitle: {fontSize: 16, fontWeight: '800', color: '#fff'},
  emptyText: {fontSize: 13, lineHeight: 20, color: '#aeb4bc', marginTop: 8},
  noData: {fontSize: 13, color: '#858d96', marginTop: 12},
  validityBadge: {borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginTop: 4},
  validityBadgeText: {fontSize: 8, fontWeight: '900'},
  legendCard: {backgroundColor: '#1d2127', borderRadius: 14, padding: 13, marginBottom: 8},
  legendTitle: {fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 8},
  legendRow: {flexDirection: 'row', alignItems: 'center', marginTop: 5},
  legendDot: {width: 8, height: 8, borderRadius: 4, marginRight: 7},
  legendText: {flex: 1, fontSize: 10, color: '#aeb4bc', lineHeight: 14},
  promotionStatusCard: {borderRadius: 9, padding: 9, marginTop: 11},
  promotionStatusTitle: {fontSize: 10, fontWeight: '900'},
  promotionStatusText: {fontSize: 10, marginTop: 3, lineHeight: 14},
  promotionItems: {marginTop: 10, borderTopWidth: 1, borderTopColor: '#30343a', paddingTop: 8},
  promotionItemRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4},
  promotionItemName: {flex: 1, color: '#f1f3f5', fontSize: 14, fontWeight: '600'},
  promotionItemPrice: {color: '#F5BE28', fontSize: 14, fontWeight: '800'},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {color: '#aeb4bc', marginTop: 12},
  errorCard: {margin: 16, padding: 18, borderRadius: 15, backgroundColor: '#2b1c1c'},
  errorTitle: {fontSize: 17, fontWeight: '800', color: '#fff'},
  errorText: {fontSize: 13, lineHeight: 20, color: '#d7bcbc', marginTop: 7},
  retryButton: {alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: '#F5BE28'},
  retryText: {fontWeight: '800', color: '#121417'},
  nav: {height: 64, borderTopWidth: 1, borderTopColor: '#252a31', backgroundColor: '#0e1012', flexDirection: 'row'},
  navButton: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2},
  navText: {fontSize: 10, fontWeight: '700', color: '#7f8790'},
  navTextActive: {color: '#F5BE28'},
});
