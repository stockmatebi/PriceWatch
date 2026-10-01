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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    const [supplierResult, productResult, snapshotResult, promotionResult] =
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
          .select('id,supplier_id,platform,title,text,image_url,post_url,posted_at,detected_at,ai_summary,is_promotion,confidence')
          .eq('is_promotion', true)
          .order('detected_at', {ascending: false})
          .limit(50),
      ]);

    const firstError =
      supplierResult.error ||
      productResult.error ||
      snapshotResult.error ||
      promotionResult.error;

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
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latest = useMemo(() => {
    const map = new Map();
    for (const row of snapshots) {
      const key = `${row.supplier_id}|${row.product_id}`;
      if (!map.has(key)) map.set(key, row);
    }
    return map;
  }, [snapshots]);

  const lastChecked = snapshots[0]?.checked_at || null;

  const openUrl = url => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const renderDashboard = () => (
    <>
      <View style={styles.hero}>
        <View>
          <Text style={styles.eyebrow}>LIVE MONITORING</Text>
          <Text style={styles.heroTitle}>Price Watch</Text>
          <Text style={styles.heroText}>
            Competitor prices monitored from configured sources.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {
          setRefreshing(true);
          loadData();
        }}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <View style={{flex: 1}}>
          <Text style={styles.statusTitle}>Monitoring online</Text>
          <Text style={styles.statusText}>
            Last data received: {timeLabel(lastChecked)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Current prices</Text>

      {products.map(product => (
        <View key={product.id} style={styles.productCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>
          {suppliers.map(supplier => {
            const row = latest.get(`${supplier.id}|${product.id}`);
            return (
              <View key={supplier.id} style={styles.priceRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.supplierName}>{supplier.name}</Text>
                  <Text style={styles.checked}>{timeLabel(row?.checked_at)}</Text>
                </View>
                <Text style={styles.price}>{money(row?.price)}</Text>
              </View>
            );
          })}
        </View>
      ))}

      {products.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No products configured</Text>
        </View>
      )}
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
      {promotions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No promotions detected yet</Text>
          <Text style={styles.emptyText}>
            Social promotion monitoring is the next monitoring layer. Price monitoring is already connected.
          </Text>
        </View>
      ) : (
        promotions.map(promotion => (
          <View key={promotion.id} style={styles.simpleCard}>
            <Text style={styles.productName}>{promotion.title || 'Supplier promotion'}</Text>
            <Text style={styles.unit}>
              {promotion.platform || 'Source'} · {timeLabel(promotion.posted_at || promotion.detected_at)}
            </Text>
            <Text style={styles.smallText}>{promotion.ai_summary || promotion.text || 'Promotion detected.'}</Text>
            {promotion.post_url ? (
              <TouchableOpacity onPress={() => openUrl(promotion.post_url)}>
                <Text style={styles.link}>View original promotion</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))
      )}
    </>
  );

  return (
    <View style={[styles.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>PRICE WATCH</Text>
            <Text style={styles.topSubtitle}>Competitor intelligence</Text>
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
        ) : (
          <>
            {error ? (
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
                    onRefresh={() => {
                      setRefreshing(true);
                      loadData();
                    }}
                    tintColor="#F5BE28"
                  />
                }>
                {tab === 'dashboard' && renderDashboard()}
                {tab === 'products' && renderProducts()}
                {tab === 'promotions' && renderPromotions()}
              </ScrollView>
            )}
          </>
        )}

        <View style={styles.nav}>
          <NavButton label="Dashboard" active={tab === 'dashboard'} onPress={() => setTab('dashboard')} />
          <NavButton label="Products" active={tab === 'products'} onPress={() => setTab('products')} />
          <NavButton label="Promotions" active={tab === 'promotions'} onPress={() => setTab('promotions')} />
        </View>
      </View>
    </View>
  );
}

function NavButton({label, active, onPress}) {
  return (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#121417'},
  container: {flex: 1, backgroundColor: '#121417'},
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#252a31',
  },
  logo: {fontSize: 20, fontWeight: '900', color: '#F5BE28', letterSpacing: 2},
  topSubtitle: {fontSize: 12, color: '#8e969f', marginTop: 3},
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d2127',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusDotSmall: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#57c878', marginRight: 6},
  liveText: {fontSize: 11, fontWeight: '800', color: '#dce2e7'},
  scroll: {flex: 1},
  content: {padding: 16, paddingBottom: 30},
  hero: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#1d2127',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {fontSize: 10, fontWeight: '800', color: '#F5BE28', letterSpacing: 1.3},
  heroTitle: {fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 5},
  heroText: {fontSize: 13, color: '#aeb4bc', marginTop: 4, maxWidth: 230},
  refreshButton: {backgroundColor: '#F5BE28', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10},
  refreshText: {fontSize: 12, fontWeight: '800', color: '#121417'},
  statusCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#18231d',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: '#57c878', marginRight: 10},
  statusTitle: {fontSize: 14, fontWeight: '800', color: '#e7f6eb'},
  statusText: {fontSize: 12, color: '#a9b7ae', marginTop: 2},
  sectionTitle: {fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 22, marginBottom: 10},
  productCard: {backgroundColor: '#1d2127', borderRadius: 16, padding: 15, marginBottom: 12},
  productName: {fontSize: 16, fontWeight: '800', color: '#fff'},
  unit: {fontSize: 12, color: '#8f98a1', marginTop: 3},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2f36',
    marginTop: 10,
  },
  supplierName: {fontSize: 13, fontWeight: '700', color: '#dce1e6'},
  checked: {fontSize: 10, color: '#7f8790', marginTop: 2},
  price: {fontSize: 19, fontWeight: '900', color: '#F5BE28', marginLeft: 12},
  simpleCard: {backgroundColor: '#1d2127', borderRadius: 15, padding: 16, marginBottom: 10},
  smallText: {fontSize: 13, lineHeight: 19, color: '#b8bec5', marginTop: 10},
  link: {fontSize: 13, fontWeight: '800', color: '#F5BE28', marginTop: 12},
  emptyCard: {backgroundColor: '#1d2127', borderRadius: 15, padding: 20, marginTop: 4},
  emptyTitle: {fontSize: 16, fontWeight: '800', color: '#fff'},
  emptyText: {fontSize: 13, lineHeight: 20, color: '#aeb4bc', marginTop: 8},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {color: '#aeb4bc', marginTop: 12},
  errorCard: {margin: 16, padding: 18, borderRadius: 15, backgroundColor: '#2b1c1c'},
  errorTitle: {fontSize: 17, fontWeight: '800', color: '#fff'},
  errorText: {fontSize: 13, lineHeight: 20, color: '#d7bcbc', marginTop: 7},
  retryButton: {alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: '#F5BE28'},
  retryText: {fontWeight: '800', color: '#121417'},
  nav: {height: 66, borderTopWidth: 1, borderTopColor: '#252a31', backgroundColor: '#0e1012', flexDirection: 'row'},
  navButton: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  navText: {fontSize: 12, fontWeight: '700', color: '#7f8790'},
  navTextActive: {color: '#F5BE28'},
});
