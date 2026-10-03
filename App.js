import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  TextInput,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {supabase} from './lib/supabase';
import npcBlueImage from './assets/npcBlue';
import m140m150Image from './assets/m140m150';
import doubleRomanImage from './assets/doubleRoman';
import timber50x76Image from './assets/timber50x76';
import timber38x38Image from './assets/timber38x38';
import timber38x114Image from './assets/timber38x114';

const money = value => (value == null ? '—' : `R${Number(value).toFixed(2)}`);
const supplierProfiles = {
  'Cashbuild Howick': {description: 'Local Cashbuild branch supplying building materials, cement, timber, hardware, plumbing and tools.', phone: '033 330 3155', email: 'smhowick@cashbuild.co.za', website: 'https://www.cashbuild.co.za/', socials: [{label: 'Facebook', url: 'https://www.facebook.com/CashbuildHowick/'}]},
  'Midlands Mica Howick': {description: 'Howick Mica hardware store serving DIY, home improvement, building, garden and related needs.', phone: '033 330 5877', alternatePhone: '086 688 4317', website: 'https://mica.co.za/store-location/kwazulu-natal/midlands-mica/', socials: [{label: 'Facebook', url: 'https://www.facebook.com/p/Midlands-Mica-61557840789993/'}, {label: 'Instagram', url: 'https://www.instagram.com/micamidlands'}]},
  'Midmar Building Supplies': {description: 'Building materials trade depot supplying blocks, bricks, retainers, pavers, sand, stone, wet-trade materials, hardware and DIY.', phone: '033 320 1143', alternatePhone: '081 491 8913', email: 'mbs@midmargroup.co.za', website: 'https://midmarbuildingsupplies.co.za/', socials: [{label: 'Facebook', url: 'https://www.facebook.com/midmarbuildingsupplies/'}, {label: 'Instagram', url: 'https://www.instagram.com/midmar_building_supplies_'}]},
  'Midmar Tile & Hardware': {description: 'Howick tile and hardware supplier offering tiles, tile accessories and related hardware products.', phone: '033 330 7617', website: 'https://g.page/midmar-tile-hardware', socials: [{label: 'Facebook', url: 'https://www.facebook.com/p/Midmar-Tile-and-Hardware-61570760241608/'}, {label: 'Instagram', url: 'https://www.instagram.com/midmar_tile_and_hardware2003'}]},
  'Timber Solutions': {description: 'Howick timber outlet specialising in structural and industrial timber, treated poles, hardware, garden decor, doors, shelving, decking and mouldings.', phone: '033 330 3569', website: 'https://www.timber-solutions.co.za/', socials: [{label: 'Facebook', url: 'https://www.facebook.com/timbersolutions1/'}, {label: 'Instagram', url: 'https://www.instagram.com/timbersolutions'}]},
};


const productImageResource = (product, promotionRows = []) => {
  const name = String(product?.name || '').toLowerCase();
  if (name.includes('npc original blue')) return npcBlueImage;
  if (name.includes('npc original black')) return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wgARCAB4AFADASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAABAUAAQMCBv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/2gAMAwEAAhADEAAAAejMC+WsMyBidjytSRCYsM5fKYIct1FB4B28n0HpnWS1qqsblAscU1O3UUoZYXqNon5gpWT1RDNWzxSlTVQY9K/QagNb9g8KRDVgsZ50Upa0eR19CHrI+ZNi3B2UL2OmeNFV1yVltjWd90VpnpHOemYZzeRpOcQXMitQystM2uO8yx5DOpCpIS5DvSQ//8QAJRAAAQQBBQACAgMAAAAAAAAAAQACAwQREBITFDEhQSAjIiQz/9oACAEBAAEFAqjWtjMMbka8WOpCupFjrx46kK42b2wsarLWObVb/WTntajZiC7jF3GIW402ZjkSrI/RF/jce4NVevyjqxNXWicrFcRNVIlS/wAmNA23fEwkVXSyImdkMxBqqkneFXvFWmZG3njK54wrM0b2Kl79q8nVpGh1aQIVnlNrvcDA8LrvD6Wtw4TrIT7e4i18i0hbXaCqY3n1XvFJJGW/r7W+LlbI3aqWt3xR4Mhjiw2JjmSs43KkCvs6Oja5cUBXBChBEuODLWNGn2vFlO+VgrBQWdPvQoglbfkj5xhfOnpP4SS4lin3yan0rOjslbStpQJ/DnZtM65lzLmXMuZcyE65WFf/xAAZEQADAAMAAAAAAAAAAAAAAAABEBEgMED/2gAIAQMBAT8B3DEKKcP/xAAbEQACAwEBAQAAAAAAAAAAAAAAARARMSESQP/aAAgBAgEBPwE6dOwtHCHotilD0Wyh6Iss9fD/AP/EAC0QAAEDAgQFBAAHAAAAAAAAAAEAAhEhMQMQElEgIjJxkUGBoeIwM0JigpKi/9oACAEBAAY/AhuaqrQVGmOy6T5UV8odRj9y6PlatPNuuVgCgk99kzzlzOAV57BWculy9R7Kjxk5MpFE2DE5El0QrPKs8LUHTk8SngbJoFoomZHSYOtYskggBPdWKRJkoaXl/Nc5PRyZkWv32VMRnuF+a2EGs32yfmxSY82X6bxdHpEGKlC1TF1/LSi2kxKfnhnYp2nDhzuoyhyGjpuqsmsiqEsrq1JupkkFAnD9IusTSIG2bMuttwjiHEbF1rD2y5t9iubEbrk82T82ZDVZOt5tRYfNBN1A2nJ9ODmwwrf6X2Vz/ZVr3euXDbw2KoI9l9V9VUT7Kx4aLpVGrp+VRqrx6EBXhrmRHyvU9yvXyrfPACK/gyTC/8QAIxABAAICAgMBAAMBAQAAAAAAAQARITFBcRBRYaGB8PGRsf/aAAgBAQABPyEtFos9zquyRWCN5JmOLg+4XqVdktQpaF8TTl3aOhY1Tcz6PsMx5ebzigfZBc/QBnOYHjb/AJD/ACIvb3Rsq+rqNUNH0XK2lNaPUBXCbrmcwHQKqCOx1WGp3WGkBapPCrEhVF6gRFqiZcJFmEK/b4X1Ylj8mt3EHTcRCVwAcsoh/wDyeN+pBZbw4nKfpfF9mbXkRWtB4hcyvoEvbxbgePykvhLzMgntlFvoMu0VDK9OjEroZFAvyIA/tpTWFuC+YqODnxU36kdzJ1GrbRPyKFgvsSyoUGBtfl9a4t5A1P5MFhJG4XZITrgxJdHVrqezUZ+18GDkTN856mDXVFOmZoFccD0XgcBrcbttt9zfqR3H9hVgUFvwSRdsl1cJ6966nPuL3BEfrmELLYy++AWUDVNeG0vGMy6V/cR0idTe0LfWDRLN6zYF+yDiL7FxnE4RrWpXaf1kLynOLNec9JU6/ENX0McT+8i49ThG9CXKTcTWFsYyX+Y0wO7juRYErHH2CjCopOivUwfsXy75GLF1KzMt+vD40SgX/uFmXEQfyIcvq4YCGIha1vcXHE1lK7iiZYlmqJ2nadp2naU9wDmVEHsuZ//aAAwDAQACAAMAAAAQzPY7u85UCLd6dCPvD1LAUr5fqGIMC9UusZVe/ijD/8QAHBEAAgMBAAMAAAAAAAAAAAAAAAERITEQIDBB/9oACAEDAQE/EFhRRR8HgihiweClEscswPBOSxtmBqVxHCUL0X1eP//EAB0RAQACAgMBAQAAAAAAAAAAAAEAERAhIDFBUWH/2gAIAQIBAT8Qe2D4xYG3B01N/Ymt5ZRKn6QoKM0geTXyAfMSpub4aRbbwS48NVl4VP/EACUQAQACAgIBBAMBAQEAAAAAAAEAESExQVFhcYGR8KGxwdEQ4f/aAAgBAQABPxBTgZjF8PbURFUKI4OiUNclDUaWn1+YkwLWOc/MGY3GzSl1+2IyaEUXjOIWIuOV/wC4gOhhqpSV5w1caONQo92Z4BmsU+6hu7fLyqQjDPw74/EXo9cP7qB/TD+zlj8v7H/pHi4+DjlZ8MXQXMGxSDTwkzQ2Sphq4BbC+sA5iZLt5mzMWlxe2VGgVbK+JbGGu0P3ANVrrMLs9I5wxsK2li16jvjwOXghajSyKVhfNS5D/wCZFmNxCzmElnYICRTq9+8WjdgJaE0a+YwUlhbHc+9/8X3eWWlsWDnHjPxmYYFeCP7PBGHycXoAgUYFrv31FF7zVrrEMBUtOEn96nE+x7YoLgmR8xt2xbAjFUwOXEsJggQ2apFc0KbrtXjEthVjC47SjNQ3wCuuMbgtLQ7PP08zOVTdw6a3Hm+uYML1E6PyjlPIHZaHkRYtQ6IFLESlgacZ5zDOQEFF7DjJl+YZLgRQNiUK8xOBUm2kLxsH8RuMeVCg854/MfCmdgZxfMWALhC0cGp9T0RloujArA0r5Rx8xWNAB5duIULoJgMWjqyt9QfiPqsYU64mrrGw3b3fM+p7ZiGy1hDQcruX1QQWGDcW9S946DQ4tSs+YkDYJcjogLWth3KuawBQQwfQKO7YNi02yl1jEsDqCiUUQO9R5OeKjzDdSw6W6urgVDFqQ/JFQQchLEmLwYK9pRSiiAnnBLEZdrJ9ZfmCwIvykRFLdXdRzIpGrc+X1jQuacG2LRFh4p/sEBOcofzACgAGQ83nnkxKRKGRKLteb6Q9pdtlAAemec3FVR8T/ZbZHwdxb6paZlnPUN5cDcLNLWIibZ0yAK85S4cfiIkYsFyTP+wSS4D6Ywpd6G4TLOQKt0z6wlBkc9RtMvEWJYDQStXi0jZnmwFCucsuLEavMS5NaqO1UcU4gLriSPTB0Qdy9ZLAEGSuuP5CwHOSp+iXRZWsFyxhAtFXQRbWr4NL9JmzFbn2rhhXwDoiGWKf+CvWHIYjYZcqGRNDxP/Z';
  if (name.includes('double roman')) return doubleRomanImage;
  if (name.includes('m140') || name.includes('m150')) return m140m150Image;
  if (name.includes('50x76') || name.includes('50 x 76')) return timber50x76Image;
  if (name.includes('38x38') || name.includes('38 x 38')) return timber38x38Image;
  if (name.includes('38x114') || name.includes('38 x 114')) return timber38x114Image;
  const normalized = name.replace(/[^a-z0-9]+/g, ' ').trim();
  const match = (promotionRows || []).find(p => p?.image_url && [p.title,p.text,p.ai_summary].filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').some(word => word.length > 3 && normalized.includes(word)));
  return match?.image_url || null;
};

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

const CASHBUILD_HOWICK_CEMENT_URL = 'https://www.cashbuild.co.za/539-cement?store=S243';

const normalizeHtmlText = html =>
  String(html || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractCashbuildProductPrice = (html, productName) => {
  const text = normalizeHtmlText(html);
  const start = text.toLowerCase().indexOf(productName.toLowerCase());
  if (start < 0) return null;
  const nearby = text.slice(start, start + 700);
  const match = nearby.match(/R\s*([0-9][0-9\s]*\.[0-9]{2})/i);
  if (!match) return null;
  const price = Number(match[1].replace(/\s/g, ''));
  return Number.isFinite(price) ? Number(price.toFixed(2)) : null;
};

const fetchCashbuildHowickVerifiedPrices = async () => {
  const response = await fetch(CASHBUILD_HOWICK_CEMENT_URL, {
    headers: {'User-Agent': 'PriceWatch/1.0'},
  });
  if (!response.ok) {
    throw new Error(`Cashbuild returned HTTP ${response.status}`);
  }
  const html = await response.text();
  const blue = extractCashbuildProductPrice(html, 'Cement NPC Blue 50kg 32.5n');
  const black = extractCashbuildProductPrice(html, 'Cement NPC Black 50kg 42.5n');
  if (blue == null || black == null) throw new Error('Cashbuild Howick product identity/price validation failed.');
  return {blue, black, checked_at: new Date().toISOString(), source_url: CASHBUILD_HOWICK_CEMENT_URL, source_type: 'verified_live', confidence: 1};
};
const parsePromotionDates = text => {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  const months = {
    january:1, february:2, march:3, april:4, may:5, june:6,
    july:7, august:8, september:9, october:10, november:11, december:12
  };
  const month = '(January|February|March|April|May|June|July|August|September|October|November|December)';
  const day = '[0-9]{1,2}(?:st|nd|rd|th)?';
  const sep = '(?:to|through|[-–—])';
  const patterns = [
    new RegExp(day+'\\s*'+month+'\\s*'+sep+'\\s*'+day+'\\s*'+month+'\\s*,?\\s*([0-9]{4})', 'i'),
    new RegExp(day+'\\s*'+sep+'\\s*'+day+'\\s*'+month+'\\s*,?\\s*([0-9]{4})', 'i'),
    new RegExp(day+'\\s*'+month+'\\s*'+sep+'\\s*'+day+'\\s*'+month+'\\s*,?\\s*([0-9]{4})', 'i')
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const raw = match[0];
    const days = [...raw.matchAll(new RegExp(day, 'gi'))].map(x => parseInt(x[0], 10));
    const names = [...raw.matchAll(new RegExp(month, 'gi'))].map(x => x[0].toLowerCase());
    const yearMatch = raw.match(/([0-9]{4})(?!.*[0-9]{4})/);
    if (days.length < 2 || !yearMatch || !names.length) continue;
    const fromMonth = months[names[0]];
    const untilMonth = months[names[names.length - 1]];
    if (!fromMonth || !untilMonth) continue;
    const pad = value => String(value).padStart(2, '0');
    return {
      from: `${yearMatch[1]}-${pad(fromMonth)}-${pad(days[0])}`,
      until: `${yearMatch[1]}-${pad(untilMonth)}-${pad(days[1])}`
    };
  }
  return null;
};

const getPromotionStatus = promotion => {
  if (!promotion) return null;
  const today = new Date().toISOString().slice(0, 10);
  const parsed = parsePromotionDates(promotion.text || promotion.ai_summary || '');
  const from = dateKey(promotion.valid_from) || parsed?.from || null;
  const until = dateKey(promotion.valid_until) || parsed?.until || null;

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
  const [compareProductId, setCompareProductId] = useState(null);
  const [historyProductId, setHistoryProductId] = useState(null);
  const [historySupplierId, setHistorySupplierId] = useState(null);
  const [supplierDetailId, setSupplierDetailId] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [manualPrices, setManualPrices] = useState([]);
  const [manualHistory, setManualHistory] = useState([]);
  const [manualSupplierId, setManualSupplierId] = useState('');
  const [manualDraft, setManualDraft] = useState({});
  const [manualSaving, setManualSaving] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [verifiedCashbuild, setVerifiedCashbuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [promotionFilter, setPromotionFilter] = useState('all');

  const loadData = useCallback(async () => {
    setError('');
    const [supplierResult, productResult, snapshotResult, manualPriceResult, manualHistoryResult, promotionResult, alertResult, runResult] =
      await Promise.all([
        supabase.from('pw_suppliers').select('id,name,location,website_url').eq('active', true).order('name'),
        supabase.from('pw_products').select('id,name,category,unit').eq('active', true).order('name'),
        supabase
          .from('pw_price_snapshots')
          .select('id,supplier_id,product_id,price,promotion_text,source_url,source_type,confidence,checked_at')
          .order('checked_at', {ascending: false})
          .limit(500),
        supabase
          .from('pw_manual_prices')
          .select('id,supplier_id,product_id,price,notes,dnu,updated_at')
          .order('updated_at', {ascending: false}),
        supabase
          .from('pw_manual_price_history')
          .select('id,supplier_id,product_id,price,notes,recorded_at,source_type')
          .order('recorded_at', {ascending: false})
          .limit(500),
        supabase
          .from('pw_promotions')
          .select('id,supplier_id,platform,title,text,image_url,post_url,posted_at,detected_at,ai_summary,ai_extraction,is_promotion,confidence,valid_from,valid_until,validity_type,validity_text,validity_confidence')
          .eq('is_promotion', true)
          .order('detected_at', {ascending: false})
          .limit(50),
        supabase
          .from('pw_alerts')
          .select('id,supplier_id,product_id,old_price,new_price,percentage_change,source_url,alert_type,detected_at,notification_status')
          .in('alert_type', ['price_change', 'promotion_price_change'])
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
      manualPriceResult.error ||
      manualHistoryResult.error ||
      promotionResult.error ||
      alertResult.error ||
      runResult.error;

    if (firstError) {
      setError(firstError.message || 'Could not load Price Watch data.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const verified = await fetchCashbuildHowickVerifiedPrices();
      setVerifiedCashbuild(verified);
    } catch (cashbuildError) {
      setVerifiedCashbuild(null);
    }

    setSuppliers(supplierResult.data || []);
    setProducts(productResult.data || []);
    setSnapshots(snapshotResult.data || []);
    setManualPrices(manualPriceResult.data || []);
    setManualHistory(manualHistoryResult.data || []);
    setPromotions(promotionResult.data || []);
    setManualSupplierId(current => current || supplierResult.data?.[0]?.id || '');
    setAlerts(alertResult.data || []);
    setLatestRun(runResult.data?.[0] || null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(), 60000);
    return () => clearInterval(timer);
  }, [loadData]);

  const historyByKey = useMemo(() => {
    const map = new Map();
    for (const row of snapshots) {
      const supplier = suppliers.find(item => item.id === row.supplier_id);
      const product = products.find(item => item.id === row.product_id);
      const productName = String(product?.name || '').toLowerCase();
      const isCashbuildNpc = supplier?.name === 'Cashbuild Howick' &&
        (productName.includes('npc original blue') || productName.includes('npc original black'));

      // Do not expose legacy Cashbuild snapshots whose product identity was not verified.
      if (isCashbuildNpc) continue;

      const key = `${row.supplier_id}|${row.product_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return map;
  }, [snapshots, suppliers, products]);

  const latest = useMemo(() => {
    const map = new Map();
    for (const [key, rows] of historyByKey.entries()) {
      map.set(key, rows[0]);
    }
    return map;
  }, [historyByKey]);

  const manualHistoryByKey = useMemo(() => {
    const map = new Map();
    for (const row of manualHistory) {
      const key = `${row.supplier_id}|${row.product_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return map;
  }, [manualHistory]);

  const manualByKey = useMemo(() => {
    const map = new Map();
    for (const row of manualPrices) {
      map.set(`${row.supplier_id}|${row.product_id}`, row);
    }
    return map;
  }, [manualPrices]);

  const supplierById = useMemo(() => {
    const map = new Map();
    for (const supplier of suppliers) map.set(supplier.id, supplier);
    return map;
  }, [suppliers]);

  const currentPriceRow = (supplierId, productId) => {
    const manual = manualByKey.get(`${supplierId}|${productId}`);
    const supplier = supplierById.get(supplierId);
    const product = products.find(item => item.id === productId);

    if (manual?.dnu) {
      return {...manual, price: null, source_type: 'dnu', checked_at: manual.updated_at};
    }

    if (supplier?.name === 'Cashbuild Howick' && verifiedCashbuild && product) {
      const productName = String(product.name || '').toLowerCase();
      if (productName.includes('npc original blue')) {
        return {supplier_id: supplierId, product_id: productId, price: verifiedCashbuild.blue, checked_at: verifiedCashbuild.checked_at, source_url: verifiedCashbuild.source_url, source_type: verifiedCashbuild.source_type, confidence: verifiedCashbuild.confidence};
      }
      if (productName.includes('npc original black')) {
        return {supplier_id: supplierId, product_id: productId, price: verifiedCashbuild.black, checked_at: verifiedCashbuild.checked_at, source_url: verifiedCashbuild.source_url, source_type: verifiedCashbuild.source_type, confidence: verifiedCashbuild.confidence};
      }
    }

    if (supplier?.name === 'Cashbuild Howick' && !verifiedCashbuild && !manual) {
      return null;
    }
    if (manual) {
      if (manual.dnu) return {...manual, price: null, source_type: 'dnu', checked_at: manual.updated_at};
      return {...manual, source_type: 'manual', checked_at: manual.updated_at};
    }
    return latest.get(`${supplierId}|${productId}`);
  };

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

  const unreadAlertCount = alerts.filter(alert => String(alert.notification_status || '').toLowerCase() !== 'read').length;

  const openAlerts = async () => {
    setTab('alerts');
    const unreadIds = alerts.filter(alert => String(alert.notification_status || '').toLowerCase() !== 'read').map(alert => alert.id).filter(Boolean);
    if (!unreadIds.length) return;
    setAlerts(current => current.map(alert => unreadIds.includes(alert.id) ? {...alert, notification_status: 'read'} : alert));
    const {error: markReadError} = await supabase.rpc('mark_pw_alerts_read', {alert_ids: unreadIds});
    if (markReadError) {
      setAlerts(current => current.map(alert => unreadIds.includes(alert.id) ? {...alert, notification_status: 'pending'} : alert));
    }
  };

  const promotionForRow = row => {
    if (!row || !row.source_url || !['facebook', 'instagram'].includes(String(row.source_type || '').toLowerCase())) return null;
    return promotions.find(promotion =>
      promotion.supplier_id === row.supplier_id &&
      promotion.post_url === row.source_url
    ) || null;
  };

  const priceStatusForRow = row => getPromotionStatus(promotionForRow(row));

  const comparePriceStyle = row => {
    if (row?.source_type === 'dnu') return {color: '#F5BE28', label: 'DNU', background: '#332c18'};
    if (!row || row.price == null) return {color: '#666f79', label: 'NO PRICE', background: '#181d24'};
    if (row.source_type === 'manual') return {color: '#27D9FF', label: 'MANUAL', background: '#102f38'};
    const promo = promotionForRow(row);
    const status = getPromotionStatus(promo);
    if (status?.key === 'valid') return {color: '#57D58A', label: 'PROMOTION ACTIVE', background: '#183022'};
    if (status?.key === 'expired') return {color: '#FF9B3D', label: 'PROMOTION OUTDATED', background: '#3a2819'};
    return {color: '#FF3340', label: 'CURRENT', background: '#351b1f'};
  };

  const priceChange = (supplierId, productId) =>
    changePct(
      latest.get(`${supplierId}|${productId}`)?.price,
      previous.get(`${supplierId}|${productId}`)?.price,
    );

  const saveManualPrice = async productId => {
    const raw = String(manualDraft[productId] ?? '').replace(',', '.').trim();
    if (!manualSupplierId || !raw) return;
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      setError('Enter a valid price.');
      return;
    }

    setManualSaving(true);
    setError('');
    const {data, error: saveError} = await supabase
      .from('pw_manual_prices')
      .upsert(
        {
          supplier_id: manualSupplierId,
          product_id: productId,
          price: Number(price.toFixed(2)),
          dnu: false,
          notes: 'Manually entered in PriceWatch',
          updated_at: new Date().toISOString(),
        },
        {onConflict: 'supplier_id,product_id'},
      )
      .select('id,supplier_id,product_id,price,notes,dnu,updated_at')
      .single();

    if (saveError) {
      setError(saveError.message || 'Could not save manual price.');
    } else {
      setManualPrices(current => [
        ...current.filter(row => !(row.supplier_id === manualSupplierId && row.product_id === productId)),
        data,
      ]);
      setManualHistory(current => [
        {
          id: `local-${Date.now()}`,
          supplier_id: manualSupplierId,
          product_id: productId,
          price: data.price,
          notes: data.notes,
          recorded_at: data.updated_at,
          source_type: 'manual',
        },
        ...current.filter(row => !(row.supplier_id === manualSupplierId && row.product_id === productId && Number(row.price) === Number(data.price) && row.recorded_at === data.updated_at)),
      ]);
      setManualDraft(current => ({...current, [productId]: String(Number(data.price).toFixed(2))}));
    }
    setManualSaving(false);
  };

  const setManualDnu = async productId => {
    if (!manualSupplierId) return;
    setManualSaving(true);
    setError('');
    const existing = manualByKey.get(`${manualSupplierId}|${productId}`);
    const {data, error: dnuError} = await supabase
      .from('pw_manual_prices')
      .upsert(
        {
          supplier_id: manualSupplierId,
          product_id: productId,
          price: existing?.price != null ? Number(existing.price) : 0,
          dnu: true,
          notes: 'DNU - supplier does not carry this line',
          updated_at: new Date().toISOString(),
        },
        {onConflict: 'supplier_id,product_id'},
      )
      .select('id,supplier_id,product_id,price,notes,dnu,updated_at')
      .single();

    if (dnuError) {
      setError(dnuError.message || 'Could not mark this line DNU.');
    } else {
      setManualPrices(current => [
        ...current.filter(row => !(row.supplier_id === manualSupplierId && row.product_id === productId)),
        data,
      ]);
      setManualDraft(current => ({...current, [productId]: ''}));
    }
    setManualSaving(false);
  };

  const clearManualPrice = async productId => {
    if (!manualSupplierId) return;
    setManualSaving(true);
    setError('');
    const {error: deleteError} = await supabase
      .from('pw_manual_prices')
      .delete()
      .eq('supplier_id', manualSupplierId)
      .eq('product_id', productId);

    if (deleteError) {
      setError(deleteError.message || 'Could not remove manual price.');
    } else {
      setManualPrices(current =>
        current.filter(row => !(row.supplier_id === manualSupplierId && row.product_id === productId)),
      );
      setManualDraft(current => ({...current, [productId]: ''}));
    }
    setManualSaving(false);
  };

  const renderManual = () => {
    const selectedSupplier = suppliers.find(supplier => supplier.id === manualSupplierId);
    return (
      <>
        <Text style={styles.sectionTitle}>Manual pricing</Text>
        <Text style={styles.pageIntro}>
          Enter a fallback price when a supplier does not publish a usable online price. Manual prices are shown in blue. When PriceWatch receives a newer verified supplier price, it automatically replaces the manual price.
        </Text>

        <View style={styles.manualNotice}>
          <Text style={styles.manualNoticeTitle}>MANUAL ENTRY</Text>
          <Text style={styles.manualNoticeText}>
            These values are fallback prices. A newer verified website or social-media price automatically overrides the manual value.
          </Text>
        </View>

        <Text style={styles.manualLabel}>Supplier</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
          {suppliers.map(supplier => (
            <TouchableOpacity
              key={supplier.id}
              style={[styles.supplierChip, supplier.id === manualSupplierId && styles.supplierChipActive]}
              onPress={() => setManualSupplierId(supplier.id)}>
              <Text style={[styles.supplierChipText, supplier.id === manualSupplierId && styles.supplierChipTextActive]}>
                {supplier.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.productCard}>
          <Text style={styles.productName}>{selectedSupplier?.name || 'Select a supplier'}</Text>
          <Text style={styles.unit}>Enter a fallback price, or mark DNU when this supplier does not carry the line.</Text>

          {products.map(product => {
            const manual = manualByKey.get(`${manualSupplierId}|${product.id}`);
            const isDnu = Boolean(manual?.dnu);
            const draftValue = manualDraft[product.id] ?? (manual && !isDnu ? String(Number(manual.price).toFixed(2)) : '');
            return (
              <View key={product.id} style={styles.manualRow}>
                <View style={{flex: 1, paddingRight: 10}}>
                  <Text style={styles.supplierName}>{product.name}</Text>
                  <Text style={styles.checked}>{isDnu ? `DNU · Updated ${timeLabel(manual.updated_at)}` : manual ? `MANUAL · Updated ${timeLabel(manual.updated_at)}` : 'No manual price entered'}</Text>
                </View>
                <TextInput
                  value={draftValue}
                  onChangeText={value => setManualDraft(current => ({...current, [product.id]: value}))}
                  placeholder={isDnu ? 'DNU' : '0.00'}
                  placeholderTextColor={isDnu ? '#F5BE28' : '#68717b'}
                  editable={!isDnu}
                  keyboardType="decimal-pad"
                  style={[styles.manualInput, isDnu && {borderColor: '#80641a', color: '#F5BE28'}]}
                />
                <TouchableOpacity
                  style={styles.manualSaveButton}
                  disabled={manualSaving || !manualSupplierId}
                  onPress={() => saveManualPrice(product.id)}>
                  <Text style={styles.manualSaveText}>{manualSaving ? '…' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manualDnuButton, isDnu && styles.manualDnuButtonActive]}
                  disabled={manualSaving || !manualSupplierId}
                  onPress={() => setManualDnu(product.id)}>
                  <Text style={[styles.manualDnuText, isDnu && styles.manualDnuTextActive]}>DNU</Text>
                </TouchableOpacity>
                {manual ? (
                  <TouchableOpacity style={styles.manualClearButton} disabled={manualSaving} onPress={() => clearManualPrice(product.id)}>
                    <Text style={styles.manualClearText}>×</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Price colour key</Text>
          <Text style={styles.manualLegendText}>BLUE PRICE / MANUAL = your fallback price until an updated monitored price is received</Text>
          <Text style={styles.legendText}>YELLOW PRICE = automatically monitored price</Text>
        </View>
      </>
    );
  };

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

    const orderedDashboardProducts = [...products].sort((a, b) => {
      const rank = product => {
        const name = String(product?.name || '').toLowerCase();
        if (name.includes('cement')) return 0;
        if (name.includes('timber')) return 2;
        return 1;
      };
      return rank(a) - rank(b);
    });

    return (
      <>
        <View style={styles.hero}>
          <View style={{flex: 1}}>
            <Text style={styles.eyebrow}>LIVE MONITORING</Text>
            <Text style={styles.heroTitle}>PriceWatch</Text>
            <Text style={styles.heroText}>Compare every supplier from one screen. Automated prices and manual fallbacks are shown together.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => { setRefreshing(true); loadData(); }}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={products.length} label="Products" />
          <StatCard value={suppliers.length} label="Suppliers" />
          <StatCard value={latest.size + manualPrices.length} label="Current prices" />
        </View>

        <View style={styles.intelligenceCard}>
          <View style={styles.intelligenceHeader}>
            <View>
              <Text style={styles.intelligenceEyebrow}>TODAY'S INTELLIGENCE</Text>
              <Text style={styles.intelligenceTitle}>What changed</Text>
            </View>
            <Text style={styles.intelligenceTime}>LIVE</Text>
          </View>
          <View style={styles.intelligenceGrid}>
            <TouchableOpacity style={styles.intelligenceMetric} onPress={() => setTab('alerts')}>
              <Text style={styles.intelligenceValue}>{alerts.filter(a => new Date(a.detected_at) >= new Date(Date.now() - 86400000)).length}</Text>
              <Text style={styles.intelligenceLabel}>PRICE CHANGES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.intelligenceMetric} onPress={() => { setPromotionFilter('active'); setTab('promotions'); }}>
              <Text style={styles.intelligenceValue}>{promotions.filter(p => getPromotionStatus(p)?.key === 'valid').length}</Text>
              <Text style={styles.intelligenceLabel}>ACTIVE SPECIALS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.intelligenceMetric} onPress={() => { setPromotionFilter('expiring'); setTab('promotions'); }}>
              <Text style={styles.intelligenceValue}>{promotions.filter(p => {
                const s = getPromotionStatus(p);
                if (!s || s.key !== 'valid' || !p.valid_until) return false;
                const days = Math.ceil((new Date(p.valid_until) - new Date(new Date().toISOString().slice(0,10))) / 86400000);
                return days >= 0 && days <= 3;
              }).length}</Text>
              <Text style={styles.intelligenceLabel}>EXPIRING ≤3 DAYS</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>All supplier prices</Text>
        <Text style={styles.pageIntro}>One product card shows the current price from every configured supplier.</Text>

        {orderedDashboardProducts.map(product => (
          <View key={product.id} style={styles.dashboardProductCard}>
            <View style={styles.dashboardProductHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.unit}>{product.unit}</Text>
              </View>
              <TouchableOpacity onPress={() => { setHistoryProductId(product.id); setHistorySupplierId(null); setTab('history'); }}>
                <Text style={styles.dashboardHistoryLink}>HISTORY ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dashboardPriceGrid}>
              {suppliers.map(supplier => {
                const row = currentPriceRow(supplier.id, product.id);
                const pct = priceChange(supplier.id, product.id);
                const isManual = row?.source_type === 'manual';
                return (
                  <View key={supplier.id} style={styles.dashboardSupplierCell}>
                    <Text style={styles.dashboardSupplierName} numberOfLines={2}>{supplier.name}</Text>
                    <Text style={[styles.dashboardSupplierPrice, isManual && styles.manualPrice]}>{money(row?.price)}</Text>
                    {isManual ? <Text style={styles.dashboardManualBadge}>MANUAL</Text> : null}
                    {!isManual && row?.price != null ? renderChange(pct, true) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

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

  const renderCompare = () => {
    const selectedProduct = products.find(product => product.id === compareProductId);

    if (selectedProduct) {
      const comparisonRows = suppliers.map(supplier => {
        const row = currentPriceRow(supplier.id, selectedProduct.id);
        const style = comparePriceStyle(row);
        return {supplier, row, style};
      });

      const available = comparisonRows
        .filter(item => item.row?.price != null)
        .sort((a, b) => Number(a.row.price) - Number(b.row.price));
      const lowest = available[0]?.row?.price;

      return (
        <>
          <TouchableOpacity style={styles.compareBackButton} onPress={() => setCompareProductId(null)}>
            <Text style={styles.compareBackText}>‹  Back to Best Pricing</Text>
          </TouchableOpacity>

          <View style={styles.compareDetailHeader}>
            <View style={styles.compareDetailImageWrap}>
              {productImageResource(selectedProduct) ? (
                <Image
                  source={{uri: productImageResource(selectedProduct)}}
                  style={styles.compareDetailImage}
                  resizeMode="contain"
                  accessibilityLabel={selectedProduct.name}
                />
              ) : null}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.compareEyebrow}>STORE-BY-STORE COMPARISON</Text>
              <Text style={styles.compareDetailTitle}>{selectedProduct.name}</Text>
              <Text style={styles.compareDetailSub}>{selectedProduct.unit} · {available.length} prices available</Text>
            </View>
          </View>

          <View style={styles.compareLegend}>
            <View style={styles.legendChip}><View style={[styles.legendDot, {backgroundColor: '#FF3340'}]} /><Text style={styles.legendChipText}>CURRENT</Text></View>
            <View style={styles.legendChip}><View style={[styles.legendDot, {backgroundColor: '#57D58A'}]} /><Text style={styles.legendChipText}>PROMOTION</Text></View>
            <View style={styles.legendChip}><View style={[styles.legendDot, {backgroundColor: '#FF9B3D'}]} /><Text style={styles.legendChipText}>OUTDATED</Text></View>
            <View style={styles.legendChip}><View style={[styles.legendDot, {backgroundColor: '#27D9FF'}]} /><Text style={styles.legendChipText}>MANUAL</Text></View>
          </View>

          <View style={styles.compareSupplierList}>
            {comparisonRows.map(({supplier, row, style}) => {
              const isLowest = lowest != null && row?.price != null && Number(row.price) === Number(lowest);
              const promo = promotionForRow(row);
              const promoStatus = getPromotionStatus(promo);

              return (
                <View key={supplier.id} style={[styles.compareSupplierCard, isLowest && styles.compareSupplierCardLowest]}>
                  <View style={styles.compareSupplierTop}>
                    <View style={{flex: 1}}>
                      <Text style={styles.compareSupplierName}>{supplier.name}</Text>
                      <Text style={styles.compareSupplierLocation}>{supplier.location || 'Howick'}</Text>
                    </View>
                    <View style={[styles.compareStatusPill, {backgroundColor: style.background}]}>
                      <View style={[styles.legendDot, {backgroundColor: style.color}]} />
                      <Text style={[styles.compareStatusText, {color: style.color}]}>{style.label}</Text>
                    </View>
                  </View>

                  <View style={styles.compareSupplierBottom}>
                    <View style={{flex: 1}}>
                      <Text style={[styles.compareSupplierPrice, {color: style.color}]}>
                        {row?.price != null ? money(row.price) : '—'}
                      </Text>
                      <Text style={styles.compareChecked}>
                        {row?.source_type === 'manual'
                          ? 'Entered ' + timeLabel(row.checked_at)
                          : row?.checked_at
                            ? 'Checked ' + timeLabel(row.checked_at)
                            : 'No price recorded'}
                      </Text>
                    </View>
                    {isLowest ? (
                      <View style={styles.cheapestLargePill}>
                        <Text style={styles.cheapestLargeText}>LOWEST</Text>
                      </View>
                    ) : null}
                  </View>

                  {promoStatus?.detail ? (
                    <Text style={[styles.comparePromoDetail, {color: style.color}]}>{promoStatus.detail}</Text>
                  ) : null}
                  {row?.promotion_text ? (
                    <Text style={styles.comparePromotionText} numberOfLines={2}>{row.promotion_text}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.compareCompactHeader}>
          <View style={{flex: 1}}>
            <Text style={styles.compareEyebrow}>LIVE PRICE INTELLIGENCE</Text>
            <Text style={styles.compareTitle}>Best pricing</Text>
            <Text style={styles.compareIntro}>Lowest available price for each monitored product.</Text>
          </View>
          <View style={styles.compareHeroMark}>
            <Text style={styles.compareHeroArrow}>↗</Text>
          </View>
        </View>

        <View style={styles.compareGrid}>
          {products.map(product => {
            const rows = suppliers
              .map(supplier => ({supplier, row: currentPriceRow(supplier.id, product.id)}))
              .filter(item => item.row?.price != null)
              .sort((a, b) => Number(a.row.price) - Number(b.row.price));

            const lowest = rows[0]?.row?.price;
            const lowestRows = lowest == null ? [] : rows.filter(item => Number(item.row.price) === Number(lowest));
            const cheapestSupplier = lowestRows.map(item => item.supplier.name).join(' · ');
            const imageResource = productImageResource(product, promotions);

            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.82}
                style={styles.compactPriceCard}
                onPress={() => setCompareProductId(product.id)}>
                <View style={styles.compactImageWrap}>
                  {imageResource ? (
                    <Image
                      source={{uri: imageResource}}
                      style={styles.compactProductImage}
                      resizeMode="contain"
                      accessibilityLabel={product.name}
                    />
                  ) : (
                    <View style={styles.compactImageFallback}>
                      <Text style={styles.productImageFallbackText}>PRICE</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.compactProductName} numberOfLines={2}>{product.name}</Text>

                {lowest == null ? (
                  <Text style={styles.compactUnavailable}>PRICE NOT AVAILABLE</Text>
                ) : (
                  <>
                    <Text style={styles.compactPrice}>{money(lowest)}</Text>
                    <View style={styles.compactCheapestPill}>
                      <View style={styles.cheapestDot} />
                      <Text style={styles.compactCheapestText} numberOfLines={1}>CHEAPEST: {cheapestSupplier}</Text>
                    </View>
                  </>
                )}
                <Text style={styles.compactTapHint}>TAP FOR ALL STORES ›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  };

  const renderHistory = () => {
    const selectedProduct = products.find(product => product.id === historyProductId);

    if (!selectedProduct) {
      return (
        <>
          <Text style={styles.sectionTitle}>Price history</Text>
          <Text style={styles.pageIntro}>Select a product to see its price history by supplier.</Text>
          {products.map(product => {
            const availableCount = suppliers.filter(supplier => {
              const automated = historyByKey.get(`${supplier.id}|${product.id}`) || [];
              const manual = manualHistoryByKey.get(`${supplier.id}|${product.id}`) || [];
              return automated.length > 0 || manual.length > 0;
            }).length;
            const imageResource = productImageResource(product);
            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.82}
                style={styles.historyProductCard}
                onPress={() => { setHistoryProductId(product.id); setHistorySupplierId(null); }}>
                <View style={styles.historyProductImageWrap}>
                  {imageResource ? (
                    <Image source={{uri: imageResource}} style={styles.historyProductImage} resizeMode="contain" accessibilityLabel={product.name} />
                  ) : (
                    <View style={styles.historyProductImageFallback}><Text style={styles.productImageFallbackText}>PRICE</Text></View>
                  )}
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.unit}>{product.unit}</Text>
                  <Text style={styles.historyMeta}>{availableCount} supplier{availableCount === 1 ? '' : 's'} with recorded prices</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </>
      );
    }

    const selectedSupplier = historySupplierId ? suppliers.find(supplier => supplier.id === historySupplierId) : null;
    const supplierTabs = [{id: null, name: 'ALL STORES'}, ...suppliers];
    const automatedRows = selectedSupplier
      ? (historyByKey.get(`${selectedSupplier.id}|${selectedProduct.id}`) || [])
      : [];
    const manualRows = selectedSupplier
      ? (manualHistoryByKey.get(`${selectedSupplier.id}|${selectedProduct.id}`) || [])
      : [];

    const historyRows = [...automatedRows.map(row => ({...row, historySource: 'automated', historyTime: row.checked_at})),
      ...manualRows.map(row => ({...row, historySource: 'manual', historyTime: row.recorded_at}))]
      .sort((a, b) => new Date(b.historyTime) - new Date(a.historyTime));

    const allCurrent = suppliers.map(supplier => ({
      supplier,
      row: currentPriceRow(supplier.id, selectedProduct.id),
    }));

    const chartRows = historyRows.slice(0, 12).reverse();
    const chartValues = chartRows.map(row => Number(row.price)).filter(Number.isFinite);
    const minPrice = chartValues.length ? Math.min(...chartValues) : 0;
    const maxPrice = chartValues.length ? Math.max(...chartValues) : 1;
    const spread = Math.max(maxPrice - minPrice, 0.01);

    return (
      <>
        <TouchableOpacity style={styles.compareBackButton} onPress={() => setHistoryProductId(null)}>
          <Text style={styles.compareBackText}>‹ BACK TO HISTORY</Text>
        </TouchableOpacity>

        <View style={styles.historyDetailHeader}>
          <View style={styles.historyDetailImageWrap}>
            {productImageResource(selectedProduct) ? (
              <Image source={{uri: productImageResource(selectedProduct)}} style={styles.historyDetailImage} resizeMode="contain" />
            ) : null}
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.historyDetailTitle}>{selectedProduct.name}</Text>
            <Text style={styles.unit}>{selectedProduct.unit} · price history</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyTabsScroll}>
          {supplierTabs.map(supplier => (
            <TouchableOpacity
              key={supplier.id || 'all'}
              style={[styles.historyTab, historySupplierId === supplier.id && styles.historyTabActive]}
              onPress={() => setHistorySupplierId(supplier.id)}>
              <Text style={[styles.historyTabText, historySupplierId === supplier.id && styles.historyTabTextActive]}>
                {supplier.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedSupplier ? (
          <>
            <View style={styles.historyCurrentCard}>
              <View style={{flex: 1}}>
                <Text style={styles.historyCurrentSupplier}>{selectedSupplier.name}</Text>
                <Text style={styles.checked}>{historyRows.length ? `${historyRows.length} recorded price event${historyRows.length === 1 ? '' : 's'}` : 'No recorded history yet'}</Text>
              </View>
              <Text style={[styles.historyCurrentPrice, currentPriceRow(selectedSupplier.id, selectedProduct.id)?.source_type === 'manual' && styles.manualPrice]}>
                {money(currentPriceRow(selectedSupplier.id, selectedProduct.id)?.price)}
              </Text>
            </View>

            {historyRows.length ? (
              <>
                <Text style={styles.historyChartTitle}>PRICE HISTORY</Text>
                <View style={styles.historyChart}>
                  {chartRows.map((row, index) => {
                    const height = 18 + ((Number(row.price) - minPrice) / spread) * 82;
                    return (
                      <View key={row.id || `${row.historyTime}-${index}`} style={styles.historyChartColumn}>
                        <Text style={styles.historyChartPrice}>{money(row.price)}</Text>
                        <View style={styles.historyChartTrack}>
                          <View style={[styles.historyChartBar, {height: Math.max(18, Math.min(100, height))}, row.historySource === 'manual' && styles.historyChartBarManual]} />
                        </View>
                        <Text style={styles.historyChartDate}>{timeLabel(row.historyTime)}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.historyTableCard}>
                  <View style={styles.historyTableHeader}>
                    <Text style={styles.historyTableHeaderText}>DATE</Text>
                    <Text style={styles.historyTableHeaderText}>PRICE</Text>
                    <Text style={styles.historyTableHeaderText}>CHANGE</Text>
                  </View>
                  {historyRows.slice(0, 12).map((row, index) => {
                    const previousRow = historyRows[index + 1];
                    const change = previousRow ? Number(row.price) - Number(previousRow.price) : null;
                    return (
                      <View key={row.id || index} style={styles.historyTableRow}>
                        <View style={{flex: 1}}>
                          <Text style={styles.historyTableDate}>{timeLabel(row.historyTime)}</Text>
                          <Text style={styles.historySourceLabel}>{row.historySource === 'manual' ? 'MANUAL' : 'MONITORED'}</Text>
                        </View>
                        <Text style={[styles.historyTablePrice, row.historySource === 'manual' && styles.manualPrice]}>{money(row.price)}</Text>
                        <Text style={[styles.historyTableChange, change != null && change < 0 ? styles.changeDown : change != null && change > 0 ? styles.changeUp : null]}>
                          {change == null ? '—' : `${change > 0 ? '▲ ' : change < 0 ? '▼ ' : ''}${money(Math.abs(change))}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No history for this supplier yet</Text>
                <Text style={styles.emptyText}>A price will appear here when PriceWatch records a monitored value or you enter a manual price.</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.historyChartTitle}>CURRENT SUPPLIER BREAKDOWN</Text>
            <View style={styles.historyAllStoresCard}>
              {allCurrent.map(({supplier, row}) => (
                <TouchableOpacity key={supplier.id} style={styles.historyAllStoreRow} onPress={() => setHistorySupplierId(supplier.id)}>
                  <View style={{flex: 1}}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    <Text style={styles.checked}>{row?.source_type === 'manual' ? 'MANUAL INPUT' : row?.price != null ? 'MONITORED PRICE' : 'NO PRICE RECORDED'}</Text>
                  </View>
                  <Text style={[styles.historyAllStorePrice, row?.source_type === 'manual' && styles.manualPrice]}>{money(row?.price)}</Text>
                  <Text style={styles.historyArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.legendCard}>
              <Text style={styles.legendTitle}>History colour key</Text>
              <Text style={styles.legendText}>RED = monitored current price</Text>
              <Text style={styles.manualLegendText}>CYAN = manual price / manual history</Text>
            </View>
          </>
        )}
      </>
    );
  };

  const renderSuppliers = () => {
    const selectedSupplier = suppliers.find(supplier => supplier.id === supplierDetailId);
    const profile = selectedSupplier ? supplierProfiles[selectedSupplier.name] || {} : null;
    if (selectedSupplier) {
      const supplierProducts = products.map(product => ({product, row: currentPriceRow(selectedSupplier.id, product.id)}));
      return (<>
        <TouchableOpacity style={styles.compareBackButton} onPress={() => setSupplierDetailId(null)}><Text style={styles.compareBackText}>‹  BACK TO SUPPLIERS</Text></TouchableOpacity>
        <View style={styles.supplierDetailHero}><View style={styles.supplierDetailIcon}><Text style={styles.supplierDetailIconText}>{selectedSupplier.name.slice(0, 1).toUpperCase()}</Text></View><View style={{flex: 1}}><Text style={styles.compareEyebrow}>SUPPLIER PROFILE</Text><Text style={styles.supplierDetailTitle}>{selectedSupplier.name}</Text><Text style={styles.supplierDetailLocation}>{selectedSupplier.location || 'Howick area'}</Text></View></View>
        <View style={styles.supplierInfoCard}><Text style={styles.supplierInfoHeading}>ABOUT</Text><Text style={styles.supplierInfoText}>{profile.description || 'Supplier information and contact details.'}</Text></View>
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.supplierInfoCard}>
          {profile.phone ? <TouchableOpacity style={styles.supplierActionRow} onPress={() => openUrl('tel:'+profile.phone.replace(/\\s/g, ''))}><Text style={styles.supplierActionLabel}>PHONE</Text><Text style={styles.supplierActionValue}>{profile.phone}</Text></TouchableOpacity> : null}
          {profile.alternatePhone ? <TouchableOpacity style={styles.supplierActionRow} onPress={() => openUrl('tel:'+profile.alternatePhone.replace(/\\s/g, ''))}><Text style={styles.supplierActionLabel}>ALTERNATE</Text><Text style={styles.supplierActionValue}>{profile.alternatePhone}</Text></TouchableOpacity> : null}
          {profile.email ? <TouchableOpacity style={styles.supplierActionRow} onPress={() => openUrl('mailto:'+profile.email)}><Text style={styles.supplierActionLabel}>EMAIL</Text><Text style={styles.supplierActionValue}>{profile.email}</Text></TouchableOpacity> : null}
          <View style={styles.supplierActionRow}><Text style={styles.supplierActionLabel}>ADDRESS</Text><Text style={styles.supplierActionValue}>{selectedSupplier.location || 'Howick area'}</Text></View>
        </View>
        <Text style={styles.sectionTitle}>Online</Text>
        <View style={styles.supplierLinksGrid}>
          {profile.website ? <TouchableOpacity style={styles.supplierLinkButton} onPress={() => openUrl(profile.website)}><Text style={styles.supplierLinkButtonTitle}>WEBSITE</Text><Text style={styles.supplierLinkButtonText}>Open supplier website ›</Text></TouchableOpacity> : null}
          {(profile.socials || []).map(social => <TouchableOpacity key={social.label} style={styles.supplierLinkButton} onPress={() => openUrl(social.url)}><Text style={styles.supplierLinkButtonTitle}>{social.label.toUpperCase()}</Text><Text style={styles.supplierLinkButtonText}>Open {social.label} ›</Text></TouchableOpacity>)}
        </View>
        <Text style={styles.sectionTitle}>PriceWatch</Text>
        <View style={styles.supplierInfoCard}><Text style={styles.supplierInfoHeading}>MONITORED PRODUCTS</Text><Text style={styles.supplierInfoText}>Current prices and manual fallbacks for this supplier.</Text>
          {supplierProducts.map(({product,row}) => <View key={product.id} style={styles.supplierProductRow}><View style={{flex:1,paddingRight:10}}><Text style={styles.supplierProductName}>{product.name}</Text><Text style={styles.checked}>{row?.source_type === 'manual' ? 'MANUAL INPUT' : row?.price != null ? 'MONITORED PRICE' : 'NO PRICE RECORDED'}</Text></View><Text style={[styles.supplierProductPrice,row?.source_type === 'manual' && styles.manualPrice]}>{money(row?.price)}</Text></View>)}
        </View>
      </>);
    }
    const visibleSuppliers = suppliers.filter(supplier => {
      if (!globalSearch.trim()) return true;
      const q = globalSearch.toLowerCase();
      const profile = supplierProfiles[supplier.name] || {};
      return [supplier.name, supplier.location, profile.description, profile.phone].some(v => String(v || '').toLowerCase().includes(q));
    });
    return (<>
      <Text style={styles.sectionTitle}>Suppliers</Text><Text style={styles.pageIntro}>Company information, contact details, websites and social media for the suppliers PriceWatch follows.</Text>
      {visibleSuppliers.map(supplier => { const profile=supplierProfiles[supplier.name] || {}; const socialCount=profile.socials?.length || 0; const latestSupplierCheck=snapshots.filter(s => s.supplier_id === supplier.id).sort((a,b)=>new Date(b.checked_at)-new Date(a.checked_at))[0]; const age=latestSupplierCheck ? Math.floor((Date.now()-new Date(latestSupplierCheck.checked_at).getTime())/3600000) : null; const health=age == null ? 'NO DATA' : age <= 2 ? 'LIVE' : age <= 6 ? 'DELAYED' : 'STALE'; return <TouchableOpacity key={supplier.id} activeOpacity={0.82} style={styles.supplierDirectoryCard} onPress={() => setSupplierDetailId(supplier.id)}><View style={styles.supplierDirectoryIcon}><Text style={styles.supplierDirectoryIconText}>{supplier.name.slice(0,1).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={styles.productName}>{supplier.name}</Text><Text style={styles.unit}>{supplier.location || 'Howick area'}</Text><Text style={styles.supplierDirectoryMeta}>{profile.phone || 'Contact details'} · {socialCount} social link{socialCount === 1 ? '' : 's'}</Text><Text style={[styles.supplierHealth, health === 'LIVE' ? styles.healthLive : health === 'DELAYED' ? styles.healthDelayed : styles.healthStale]}>{health}{age != null ? ` · checked ${age}h ago` : ''}</Text></View><Text style={styles.historyArrow}>›</Text></TouchableOpacity>; })}
    </>);
  };

  const renderAlerts = () => (
    <>
      <Text style={styles.sectionTitle}>Price alerts</Text>
      <Text style={styles.pageIntro}>PriceWatch checks for changes automatically every hour while monitoring is active.</Text>
      {(() => {
        const today = new Date().toISOString().slice(0, 10);
        const visibleAlerts = alerts.filter(alert => {
          const product = products.find(item => item.id === alert.product_id);
          const supplier = suppliers.find(item => item.id === alert.supplier_id);
          const productName = String(product?.name || '').toLowerCase();
          const isCashbuildNpc = supplier?.name === 'Cashbuild Howick' &&
            (productName.includes('npc original blue') || productName.includes('npc original black'));
          if (!isCashbuildNpc || !verifiedCashbuild || !alert.detected_at) return true;
          const detectedDate = new Date(alert.detected_at).toISOString().slice(0, 10);
          if (detectedDate !== today) return true;
          const expected = productName.includes('npc original blue') ? verifiedCashbuild.blue : verifiedCashbuild.black;
          return Number(alert.new_price) === Number(expected);
        });

        return visibleAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No verified price alerts yet</Text>
            <Text style={styles.emptyText}>PriceWatch will only show a Cashbuild Howick NPC alert when the product name and price have been verified against the supplier page.</Text>
          </View>
        ) : visibleAlerts.map(alert => {
        const product = products.find(item => item.id === alert.product_id);
        const supplier = suppliers.find(item => item.id === alert.supplier_id);
        const increase = Number(alert.percentage_change) > 0;
        return (
          <View key={alert.id} style={styles.changeCard}>
            <View style={{flex: 1}}>
              <Text style={styles.productName}>{product?.name || 'Monitored product'}</Text>
              <Text style={styles.unit}>{supplier?.name || 'Supplier'} · {timeLabel(alert.detected_at)}</Text>
              <Text style={styles.checked}>{alert.alert_type === 'promotion_price_change' ? 'PROMOTION PRICE CHANGE' : 'PRICE CHANGE'}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.price}>{money(alert.new_price)}</Text>
              <Text style={[styles.change, increase ? styles.changeUp : styles.changeDown]}>
                {increase ? '▲ ' : '▼ '}{Math.abs(Number(alert.percentage_change)).toFixed(1)}%
              </Text>
            </View>
          </View>
        );
      });
      })()}
    </>
  );

  const renderPromotions = () => {
    const filteredPromotions = promotions.filter(promotion => {
      const status = getPromotionStatus(promotion);
      if (promotionFilter === 'active') return status?.key === 'valid';
      if (promotionFilter === 'expiring') {
        if (status?.key !== 'valid' || !promotion.valid_until) return false;
        const today = new Date(new Date().toISOString().slice(0, 10));
        const until = new Date(promotion.valid_until);
        const days = Math.ceil((until - today) / 86400000);
        return days >= 0 && days <= 3;
      }
      if (promotionFilter === 'expired') return status?.key === 'expired';
      if (promotionFilter === 'unknown') return status?.key === 'unknown';
      return true;
    }).filter(promotion => {
      if (!globalSearch.trim()) return true;
      const q = globalSearch.toLowerCase();
      const supplier = suppliers.find(s => s.id === promotion.supplier_id);
      return [supplier?.name, promotion.title, promotion.text, promotion.ai_summary].some(v => String(v || '').toLowerCase().includes(q));
    });

    return (
    <>
      <Text style={styles.sectionTitle}>Promotions</Text>
      <View style={styles.filterRow}>
        {[
          ['all', 'ALL'],
          ['active', 'ACTIVE'],
          ['expiring', 'EXPIRING'],
          ['expired', 'EXPIRED'],
          ['unknown', 'UNKNOWN'],
        ].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setPromotionFilter(key)} style={[styles.filterChip, promotionFilter === key && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, promotionFilter === key && styles.filterChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
      ) : filteredPromotions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matching promotions</Text>
          <Text style={styles.emptyText}>No promotions match the selected filter or search.</Text>
        </View>
      ) : filteredPromotions.map(promotion => (
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
  };

  const tabTitle = {dashboard: 'Dashboard', compare: 'Compare', history: 'History', suppliers: 'Suppliers', manual: 'Manual', promotions: 'Promotions', alerts: 'Alerts'}[tab];

  return (
    <View style={[styles.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Image source={{uri: 'pricewatch_mark'}} style={styles.logoMarkImage} resizeMode="contain" accessibilityLabel="PriceWatch logo" />
            </View>
            <View>
              <Text style={styles.logo}><Text style={styles.logoPrice}>Price</Text><Text style={styles.logoWatch}>Watch</Text></Text>
              <Text style={styles.topSubtitle}>{tabTitle} · Competitor intelligence</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.alertButton} onPress={openAlerts} accessibilityLabel="Open alerts">
              <View style={styles.bellBody} />
              <View style={styles.bellClapper} />
              {unreadAlertCount > 0 ? (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{unreadAlertCount > 9 ? '9+' : unreadAlertCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <View style={styles.livePill}>
              <View style={styles.statusDotSmall} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.globalSearchWrap}>
          <TextInput
            value={globalSearch}
            onChangeText={setGlobalSearch}
            placeholder="Search products, suppliers and promotions…"
            placeholderTextColor="#707780"
            style={styles.globalSearchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {globalSearch ? <TouchableOpacity onPress={() => setGlobalSearch('')}><Text style={styles.globalSearchClear}>×</Text></TouchableOpacity> : null}
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
            {tab === 'suppliers' && renderSuppliers()}
            {tab === 'manual' && renderManual()}
            {tab === 'promotions' && renderPromotions()}
            {tab === 'alerts' && renderAlerts()}
          </ScrollView>
        )}

        <View style={styles.nav}>
          <NavButton label="Dashboard" active={tab === 'dashboard'} onPress={() => setTab('dashboard')} />
          <NavButton label="Compare" active={tab === 'compare'} onPress={() => setTab('compare')} />
          <NavButton label="History" active={tab === 'history'} onPress={() => setTab('history')} />
          <NavButton label="Suppliers" active={tab === 'suppliers'} onPress={() => setTab('suppliers')} />
          <NavButton label="Manual" active={tab === 'manual'} onPress={() => setTab('manual')} />
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
  intelligenceCard: {backgroundColor:'#12161b', borderRadius:18, padding:15, marginTop:4, marginBottom:20, borderWidth:1, borderColor:'#242a31'},
  intelligenceHeader: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:13},
  intelligenceEyebrow: {fontSize:10, fontWeight:'900', color:'#F5BE28', letterSpacing:1},
  intelligenceTitle: {fontSize:19, fontWeight:'900', color:'#fff', marginTop:3},
  intelligenceTime: {fontSize:10, fontWeight:'900', color:'#57d58a'},
  intelligenceGrid: {flexDirection:'row', gap:8},
  intelligenceMetric: {flex:1, backgroundColor:'#0c0f13', borderRadius:12, padding:10},
  intelligenceValue: {fontSize:22, fontWeight:'900', color:'#fff'},
  intelligenceLabel: {fontSize:8, fontWeight:'800', color:'#8b929b', marginTop:4},
  filterRow: {flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:12},
  filterChip: {paddingHorizontal:11, paddingVertical:7, borderRadius:14, backgroundColor:'#181d23', borderWidth:1, borderColor:'#272d34'},
  filterChipActive: {backgroundColor:'#332c18', borderColor:'#F5BE28'},
  filterChipText: {fontSize:9, fontWeight:'900', color:'#858c95'},
  filterChipTextActive: {color:'#F5BE28'},
  globalSearchWrap: {marginHorizontal:14, marginTop:10, marginBottom:2, height:42, borderRadius:13, backgroundColor:'#12161b', borderWidth:1, borderColor:'#252b32', flexDirection:'row', alignItems:'center', paddingHorizontal:12},
  globalSearchInput: {flex:1, color:'#fff', fontSize:13, paddingVertical:0},
  globalSearchClear: {color:'#9ba2aa', fontSize:23, lineHeight:25, paddingLeft:8},
  supplierHealth: {fontSize:8, fontWeight:'900', marginTop:5},
  healthLive: {color:'#57d58a'},
  healthDelayed: {color:'#F5BE28'},
  healthStale: {color:'#ff7777'},

  safe: {flex: 1, backgroundColor: '#08090d'},
  container: {flex: 1, backgroundColor: '#08090d'},
  topBar: {paddingHorizontal: 12, paddingTop: 10, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#171b21', minHeight: 82},
  brandBlock: {flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0},
  logoMark: {width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginRight: 10},
  logoMarkImage: {width: 52, height: 52},
  logo: {fontSize: 21, fontWeight: '900', color: '#fff', letterSpacing: 0.2, flexShrink: 1},
  logoPrice: {color: '#fff'},
  logoWatch: {color: '#FF3340'},
  topSubtitle: {fontSize: 10, color: '#8b929b', marginTop: 3, letterSpacing: 0.15, flexShrink: 1},
  headerActions: {flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6},
  alertButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', position: 'relative'},
  bellBody: {width: 23, height: 20, borderWidth: 2, borderColor: '#eef2f5', borderRadius: 12, borderBottomLeftRadius: 7, borderBottomRightRadius: 7},
  bellClapper: {position: 'absolute', bottom: 7, width: 7, height: 3, borderRadius: 2, backgroundColor: '#eef2f5'},
  alertBadge: {position: 'absolute', top: 1, right: 1, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#ff4545', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#121417'},
  alertBadgeText: {fontSize: 9, fontWeight: '900', color: '#fff'},
  livePill: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d2127', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 7, minWidth: 76, justifyContent: 'center'},
  statusDotSmall: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#57c878', marginRight: 6},
  liveText: {fontSize: 11, fontWeight: '800', color: '#dce2e7'},
  scroll: {flex: 1},
  content: {paddingHorizontal: 14, paddingTop: 18, paddingBottom: 30},
  compareBackButton: {paddingVertical: 4, marginBottom: 10},
  compareBackText: {fontSize: 12, fontWeight: '900', color: '#F5BE28'},
  compareDetailHeader: {minHeight: 118, padding: 12, borderRadius: 16, backgroundColor: '#111419', borderWidth: 1, borderColor: '#1f242c', flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  compareDetailImageWrap: {width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  compareDetailImage: {width: 92, height: 92},
  compareDetailTitle: {fontSize: 20, lineHeight: 24, fontWeight: '900', color: '#fff', marginTop: 3},
  compareDetailSub: {fontSize: 10, color: '#858d96', marginTop: 5},
  compareLegend: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10},
  legendChip: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#111419', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, borderWidth: 1, borderColor: '#1f242c'},
  legendDot: {width: 7, height: 7, borderRadius: 4, marginRight: 5},
  legendChipText: {fontSize: 8, fontWeight: '900', color: '#aeb5bd'},
  compareSupplierList: {gap: 9},
  compareSupplierCard: {backgroundColor: '#111419', borderRadius: 15, borderWidth: 1, borderColor: '#1f242c', padding: 12},
  compareSupplierCardLowest: {borderColor: '#57D58A'},
  compareSupplierTop: {flexDirection: 'row', alignItems: 'flex-start'},
  compareSupplierName: {fontSize: 15, fontWeight: '900', color: '#fff'},
  compareSupplierLocation: {fontSize: 9, color: '#747d87', marginTop: 2},
  compareStatusPill: {flexDirection: 'row', alignItems: 'center', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, marginLeft: 8},
  compareStatusText: {fontSize: 8, fontWeight: '900'},
  compareSupplierBottom: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  compareSupplierPrice: {fontSize: 26, lineHeight: 30, fontWeight: '900'},
  compareChecked: {fontSize: 9, color: '#747d87', marginTop: 2},
  cheapestLargePill: {borderRadius: 8, backgroundColor: '#153520', paddingHorizontal: 10, paddingVertical: 7},
  cheapestLargeText: {fontSize: 9, fontWeight: '900', color: '#57D58A'},
  comparePromoDetail: {fontSize: 9, fontWeight: '800', marginTop: 7},
  comparePromotionText: {fontSize: 10, lineHeight: 14, color: '#aeb5bd', marginTop: 3},
  compareCompactHeader: {height: 86, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, backgroundColor: '#111419', borderWidth: 1, borderColor: '#1f242c', flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  compareEyebrow: {fontSize: 10, fontWeight: '900', color: '#F5BE28', letterSpacing: 1.3},
  compareTitle: {fontSize: 23, fontWeight: '900', color: '#fff', marginTop: 2},
  compareIntro: {fontSize: 10, lineHeight: 14, color: '#9299a2', marginTop: 2, maxWidth: 260},
  compareHeroMark: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#181d24', alignItems: 'center', justifyContent: 'center', marginLeft: 8},
  compareHeroArrow: {fontSize: 27, fontWeight: '900', color: '#ff3340', marginTop: -2},
  compareGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  compactPriceCard: {width: '48.5%', height: 238, backgroundColor: '#111419', borderRadius: 16, borderWidth: 1, borderColor: '#1f242c', padding: 11, marginBottom: 9},
  compactImageWrap: {height: 94, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  compactProductImage: {width: 88, height: 88},
  compactImageFallback: {width: 78, height: 78, borderRadius: 14, backgroundColor: '#181d24', alignItems: 'center', justifyContent: 'center'},
  productImageFallbackText: {fontSize: 9, fontWeight: '900', color: '#666f79'},
  compactProductName: {fontSize: 13, lineHeight: 16, fontWeight: '900', color: '#fff', minHeight: 32},
  compactPrice: {fontSize: 24, lineHeight: 28, fontWeight: '900', color: '#ff3340', marginTop: 8},
  compactUnavailable: {fontSize: 9, fontWeight: '900', color: '#777f89', marginTop: 9},
  compactCheapestPill: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#153520', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 5, marginTop: 6},
  cheapestDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#38d66b', marginRight: 5},
  compactCheapestText: {flex: 1, fontSize: 8, fontWeight: '900', color: '#5be582'},
  hero: {padding: 17, borderRadius: 18, backgroundColor: '#111419', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
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
  statCard: {flex: 1, backgroundColor: '#111419', borderRadius: 13, padding: 12},
  statValue: {fontSize: 21, fontWeight: '900', color: '#F5BE28'},
  statLabel: {fontSize: 10, color: '#8f98a1', marginTop: 3},
  sectionTitle: {fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 22, marginBottom: 8},
  pageIntro: {fontSize: 13, color: '#9da5ad', lineHeight: 19, marginBottom: 10},
  productCard: {backgroundColor: '#111419', borderRadius: 16, padding: 15, marginBottom: 12},
  productName: {fontSize: 16, fontWeight: '800', color: '#fff'},
  unit: {fontSize: 12, color: '#8f98a1', marginTop: 3},
  priceRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#2a2f36', marginTop: 9},
  supplierName: {fontSize: 13, fontWeight: '700', color: '#dce1e6'},
  checked: {fontSize: 10, color: '#7f8790', marginTop: 2},
  priceRight: {alignItems: 'flex-end', marginLeft: 10},
  price: {fontSize: 18, fontWeight: '900', color: '#ff3340'},
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
  dashboardProductCard: {backgroundColor: '#111419', borderRadius: 14, padding: 10, marginBottom: 7, borderWidth: 1, borderColor: '#1f242c'},
  dashboardProductHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  dashboardHistoryLink: {fontSize: 8, fontWeight: '900', color: '#F5BE28'},
  dashboardPriceGrid: {flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#2a2f36'},
  dashboardSupplierCell: {width: '50%', minHeight: 55, paddingVertical: 7, paddingRight: 7, borderBottomWidth: 1, borderBottomColor: '#20252b'},
  dashboardSupplierName: {fontSize: 9, lineHeight: 11, color: '#aeb5bd', fontWeight: '800'},
  dashboardSupplierPrice: {fontSize: 16, fontWeight: '900', color: '#ff3340', marginTop: 2},
  dashboardManualBadge: {fontSize: 7, fontWeight: '900', color: '#4FC3F7', marginTop: 1},
  dashboardDnuBadge: {fontSize: 16, fontWeight: '900', color: '#F5BE28', marginTop: 3},
  historyDnuBadge: {fontSize: 14, fontWeight: '900', color: '#F5BE28', marginHorizontal: 6},
  supplierDnuBadge: {fontSize: 14, fontWeight: '900', color: '#F5BE28', paddingTop: 4},
  historyProductCard: {backgroundColor: '#111419', borderRadius: 16, borderWidth: 1, borderColor: '#1f242c', padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center'},
  historyProductImageWrap: {width: 78, height: 78, marginRight: 12, alignItems: 'center', justifyContent: 'center'},
  historyProductImage: {width: 74, height: 74},
  historyProductImageFallback: {width: 62, height: 62, borderRadius: 12, backgroundColor: '#181d24', alignItems: 'center', justifyContent: 'center'},
  historyMeta: {fontSize: 10, color: '#747d87', marginTop: 6},
  historyArrow: {fontSize: 28, color: '#F5BE28', fontWeight: '700', marginLeft: 8},
  historyDetailHeader: {minHeight: 112, padding: 12, borderRadius: 16, backgroundColor: '#111419', borderWidth: 1, borderColor: '#1f242c', flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  historyDetailImageWrap: {width: 86, height: 86, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  historyDetailImage: {width: 82, height: 82},
  historyDetailTitle: {fontSize: 19, lineHeight: 23, fontWeight: '900', color: '#fff'},
  historyTabsScroll: {marginBottom: 10},
  historyTab: {backgroundColor: '#1d2127', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, marginRight: 7, borderWidth: 1, borderColor: '#2a3037'},
  historyTabActive: {backgroundColor: '#3a2f12', borderColor: '#F5BE28'},
  historyTabText: {fontSize: 9, fontWeight: '900', color: '#aeb4bc'},
  historyTabTextActive: {color: '#F5BE28'},
  historyCurrentCard: {backgroundColor: '#111419', borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#1f242c'},
  historyCurrentSupplier: {fontSize: 14, fontWeight: '900', color: '#fff'},
  historyCurrentPrice: {fontSize: 25, fontWeight: '900', color: '#ff3340'},
  historyChartTitle: {fontSize: 10, fontWeight: '900', color: '#F5BE28', letterSpacing: 1.1, marginBottom: 7},
  historyChart: {height: 154, backgroundColor: '#111419', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderColor: '#1f242c', marginBottom: 12},
  historyChartColumn: {flex: 1, height: 132, alignItems: 'center', justifyContent: 'flex-end', minWidth: 44},
  historyChartPrice: {fontSize: 7, color: '#cbd1d7', marginBottom: 4},
  historyChartTrack: {height: 100, width: 18, justifyContent: 'flex-end', backgroundColor: '#181d24', borderRadius: 5, overflow: 'hidden'},
  historyChartBar: {width: '100%', backgroundColor: '#FF3340', borderRadius: 5},
  historyChartBarManual: {backgroundColor: '#4FC3F7'},
  historyChartDate: {fontSize: 7, color: '#707983', marginTop: 5, transform: [{rotate: '-35deg'}], width: 52, textAlign: 'center'},
  historyTableCard: {backgroundColor: '#111419', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1f242c'},
  historyTableHeader: {flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#2a2f36'},
  historyTableHeaderText: {flex: 1, fontSize: 8, fontWeight: '900', color: '#7f8790'},
  historyTableRow: {flexDirection: 'row', alignItems: 'center', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#20252b'},
  historyTableDate: {fontSize: 10, color: '#dce1e6', fontWeight: '700'},
  historySourceLabel: {fontSize: 7, color: '#6f7882', marginTop: 2, fontWeight: '900'},
  historyTablePrice: {flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '900', color: '#ff3340'},
  historyTableChange: {flex: 1, textAlign: 'right', fontSize: 10, fontWeight: '900', color: '#8d959e'},
  historyAllStoresCard: {backgroundColor: '#111419', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1f242c', marginBottom: 10},
  historyAllStoreRow: {flexDirection: 'row', alignItems: 'center', minHeight: 61, borderBottomWidth: 1, borderBottomColor: '#20252b'},
  supplierDirectoryCard: {backgroundColor: '#111419', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1f242c', flexDirection: 'row', alignItems: 'center'},
  supplierDirectoryIcon: {width: 48, height: 48, borderRadius: 14, backgroundColor: '#1b2027', borderWidth: 1, borderColor: '#303640', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  supplierDirectoryIconText: {fontSize: 20, fontWeight: '900', color: '#F5BE28'},
  supplierDirectoryMeta: {fontSize: 9, color: '#707983', marginTop: 7},
  supplierDetailHero: {backgroundColor: '#111419', borderRadius: 17, borderWidth: 1, borderColor: '#1f242c', padding: 16, flexDirection: 'row', alignItems: 'center'},
  supplierDetailIcon: {width: 64, height: 64, borderRadius: 18, backgroundColor: '#3a2f12', borderWidth: 1, borderColor: '#F5BE28', alignItems: 'center', justifyContent: 'center', marginRight: 13},
  supplierDetailIconText: {fontSize: 27, fontWeight: '900', color: '#F5BE28'},
  supplierDetailTitle: {fontSize: 21, lineHeight: 25, fontWeight: '900', color: '#fff', marginTop: 3},
  supplierDetailLocation: {fontSize: 10, color: '#858d96', marginTop: 5},
  supplierInfoCard: {backgroundColor: '#111419', borderRadius: 15, borderWidth: 1, borderColor: '#1f242c', padding: 14, marginBottom: 4},
  supplierInfoHeading: {fontSize: 10, fontWeight: '900', color: '#F5BE28', letterSpacing: 1, marginBottom: 7},
  supplierInfoText: {fontSize: 12, lineHeight: 18, color: '#aeb5bd'},
  supplierActionRow: {flexDirection: 'row', alignItems: 'center', minHeight: 45, borderBottomWidth: 1, borderBottomColor: '#20252b'},
  supplierActionLabel: {width: 76, fontSize: 8, fontWeight: '900', color: '#6f7882'},
  supplierActionValue: {flex: 1, fontSize: 12, color: '#dce1e6', fontWeight: '700'},
  supplierLinksGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  supplierLinkButton: {width: '48.5%', backgroundColor: '#111419', borderRadius: 13, borderWidth: 1, borderColor: '#1f242c', padding: 12, marginBottom: 8},
  supplierLinkButtonTitle: {fontSize: 9, fontWeight: '900', color: '#F5BE28', letterSpacing: 0.8},
  supplierLinkButtonText: {fontSize: 11, fontWeight: '800', color: '#dce1e6', marginTop: 7},
  supplierProductRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#20252b', marginTop: 8},
  supplierProductName: {fontSize: 11, fontWeight: '800', color: '#dce1e6'},
  supplierProductPrice: {fontSize: 18, fontWeight: '900', color: '#ff3340'},
  simpleCard: {backgroundColor: '#111419', borderRadius: 15, padding: 16, marginBottom: 10},
  smallText: {fontSize: 13, lineHeight: 19, color: '#b8bec5', marginTop: 10},
  link: {fontSize: 13, fontWeight: '800', color: '#F5BE28', marginTop: 12},
  manualNotice: {backgroundColor: '#172631', borderRadius: 14, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: '#28506a'},
  manualNoticeTitle: {fontSize: 11, fontWeight: '900', color: '#4FC3F7', letterSpacing: 0.8},
  manualNoticeText: {fontSize: 12, lineHeight: 18, color: '#b9c7d0', marginTop: 4},
  manualLabel: {fontSize: 12, fontWeight: '800', color: '#dce1e6', marginBottom: 7},
  supplierChip: {backgroundColor: '#1d2127', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9, marginRight: 7, borderWidth: 1, borderColor: '#2a3037'},
  supplierChipActive: {backgroundColor: '#203747', borderColor: '#4FC3F7'},
  supplierChipText: {fontSize: 11, fontWeight: '700', color: '#aeb4bc'},
  supplierChipTextActive: {color: '#4FC3F7'},
  manualRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#2a2f36', marginTop: 9},
  manualInput: {width: 72, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#3b454f', backgroundColor: '#12171b', color: '#4FC3F7', fontSize: 14, fontWeight: '800', textAlign: 'right', paddingHorizontal: 8},
  manualSaveButton: {marginLeft: 6, backgroundColor: '#4FC3F7', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 11},
  manualSaveText: {fontSize: 10, fontWeight: '900', color: '#10202a'},
  manualDnuButton: {borderWidth: 1, borderColor: '#80641a', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 9, marginLeft: 4, backgroundColor: '#211d10'},
  manualDnuButtonActive: {backgroundColor: '#3a3015', borderColor: '#F5BE28'},
  manualDnuText: {color: '#F5BE28', fontWeight: '800', fontSize: 10},
  manualDnuTextActive: {color: '#fff'},
  manualClearButton: {marginLeft: 4, width: 27, height: 40, borderRadius: 8, backgroundColor: '#2a2020', alignItems: 'center', justifyContent: 'center'},
  manualClearText: {fontSize: 20, color: '#ff7777', lineHeight: 20},
  manualPrice: {color: '#4FC3F7'},
  manualBadgeText: {fontSize: 8, fontWeight: '900', color: '#4FC3F7', marginTop: 2},
  manualLegendText: {fontSize: 10, fontWeight: '800', color: '#4FC3F7', marginTop: 5},
  emptyCard: {backgroundColor: '#111419', borderRadius: 15, padding: 18, marginTop: 4},
  emptyTitle: {fontSize: 16, fontWeight: '800', color: '#fff'},
  emptyText: {fontSize: 13, lineHeight: 20, color: '#aeb4bc', marginTop: 8},
  noData: {fontSize: 13, color: '#858d96', marginTop: 12},
  validityBadge: {borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginTop: 4},
  validityBadgeText: {fontSize: 8, fontWeight: '900'},
  legendCard: {backgroundColor: '#111419', borderRadius: 14, padding: 13, marginBottom: 8},
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
  nav: {height: 70, borderTopWidth: 1, borderTopColor: '#171b21', backgroundColor: '#08090d', flexDirection: 'row'},
  navButton: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2},
  navText: {fontSize: 8, fontWeight: '700', color: '#7f8790'},
  navTextActive: {color: '#F5BE28'},
});