// Currency metadata for the FX price calculator (汇率换算).
// The backend returns raw rates for ~160 currencies; this table is the
// curated country list the calculator offers — the page intersects it
// with whatever the rate table actually contains. `decimals` drives
// display formatting (0 for large-denomination currencies, 3 for the
// dinar/rial currencies that price in thousandths).
export const CURRENCIES = [
  { country: '中国', currency: '人民币', code: 'CNY', symbol: '¥', decimals: 2 },
  { country: '美国', currency: '美元', code: 'USD', symbol: '$', decimals: 2 },
  { country: '欧元区', currency: '欧元', code: 'EUR', symbol: '€', decimals: 2 },
  { country: '英国', currency: '英镑', code: 'GBP', symbol: '£', decimals: 2 },
  { country: '南非', currency: '兰特', code: 'ZAR', symbol: 'R', decimals: 2 },
  { country: '阿联酋', currency: '迪拉姆', code: 'AED', symbol: 'AED ', decimals: 2 },
  { country: '沙特阿拉伯', currency: '里亚尔', code: 'SAR', symbol: 'SAR ', decimals: 2 },
  { country: '卡塔尔', currency: '里亚尔', code: 'QAR', symbol: 'QAR ', decimals: 2 },
  { country: '科威特', currency: '第纳尔', code: 'KWD', symbol: 'KWD ', decimals: 3 },
  { country: '阿曼', currency: '里亚尔', code: 'OMR', symbol: 'OMR ', decimals: 3 },
  { country: '印度尼西亚', currency: '印尼盾', code: 'IDR', symbol: 'Rp', decimals: 0 },
  { country: '越南', currency: '越南盾', code: 'VND', symbol: '₫', decimals: 0 },
  { country: '泰国', currency: '泰铢', code: 'THB', symbol: '฿', decimals: 2 },
  { country: '马来西亚', currency: '林吉特', code: 'MYR', symbol: 'RM', decimals: 2 },
  { country: '新加坡', currency: '新加坡元', code: 'SGD', symbol: 'S$', decimals: 2 },
  { country: '菲律宾', currency: '比索', code: 'PHP', symbol: '₱', decimals: 2 },
  { country: '缅甸', currency: '缅元', code: 'MMK', symbol: 'MMK ', decimals: 2 },
  { country: '柬埔寨', currency: '瑞尔', code: 'KHR', symbol: 'KHR ', decimals: 2 },
  { country: '日本', currency: '日元', code: 'JPY', symbol: '¥', decimals: 0 },
  { country: '韩国', currency: '韩元', code: 'KRW', symbol: '₩', decimals: 0 },
  { country: '印度', currency: '卢比', code: 'INR', symbol: '₹', decimals: 2 },
  { country: '巴基斯坦', currency: '卢比', code: 'PKR', symbol: 'PKR ', decimals: 2 },
  { country: '孟加拉国', currency: '塔卡', code: 'BDT', symbol: 'BDT ', decimals: 2 },
  { country: '斯里兰卡', currency: '卢比', code: 'LKR', symbol: 'LKR ', decimals: 2 },
  { country: '澳大利亚', currency: '澳元', code: 'AUD', symbol: 'A$', decimals: 2 },
  { country: '新西兰', currency: '新西兰元', code: 'NZD', symbol: 'NZ$', decimals: 2 },
  { country: '香港', currency: '港元', code: 'HKD', symbol: 'HK$', decimals: 2 },
  { country: '台湾', currency: '新台币', code: 'TWD', symbol: 'NT$', decimals: 2 },
  { country: '俄罗斯', currency: '卢布', code: 'RUB', symbol: '₽', decimals: 2 },
  { country: '哈萨克斯坦', currency: '坚戈', code: 'KZT', symbol: 'KZT ', decimals: 2 },
  { country: '乌兹别克斯坦', currency: '索姆', code: 'UZS', symbol: 'UZS ', decimals: 2 },
  { country: '土耳其', currency: '里拉', code: 'TRY', symbol: '₺', decimals: 2 },
  { country: '以色列', currency: '新谢克尔', code: 'ILS', symbol: '₪', decimals: 2 },
  { country: '瑞士', currency: '瑞士法郎', code: 'CHF', symbol: 'CHF ', decimals: 2 },
  { country: '波兰', currency: '兹罗提', code: 'PLN', symbol: 'zł', decimals: 2 },
  { country: '瑞典', currency: '瑞典克朗', code: 'SEK', symbol: 'kr', decimals: 2 },
  { country: '挪威', currency: '挪威克朗', code: 'NOK', symbol: 'kr', decimals: 2 },
  { country: '丹麦', currency: '丹麦克朗', code: 'DKK', symbol: 'kr', decimals: 2 },
  { country: '捷克', currency: '捷克克朗', code: 'CZK', symbol: 'Kč', decimals: 2 },
  { country: '匈牙利', currency: '福林', code: 'HUF', symbol: 'Ft', decimals: 2 },
  { country: '罗马尼亚', currency: '列伊', code: 'RON', symbol: 'RON ', decimals: 2 },
  { country: '乌克兰', currency: '格里夫纳', code: 'UAH', symbol: '₴', decimals: 2 },
  { country: '加拿大', currency: '加元', code: 'CAD', symbol: 'C$', decimals: 2 },
  { country: '墨西哥', currency: '比索', code: 'MXN', symbol: '$', decimals: 2 },
  { country: '巴西', currency: '雷亚尔', code: 'BRL', symbol: 'R$', decimals: 2 },
  { country: '阿根廷', currency: '比索', code: 'ARS', symbol: '$', decimals: 2 },
  { country: '智利', currency: '比索', code: 'CLP', symbol: '$', decimals: 0 },
  { country: '哥伦比亚', currency: '比索', code: 'COP', symbol: '$', decimals: 2 },
  { country: '秘鲁', currency: '索尔', code: 'PEN', symbol: 'S/', decimals: 2 },
  { country: '尼日利亚', currency: '奈拉', code: 'NGN', symbol: '₦', decimals: 2 },
  { country: '肯尼亚', currency: '先令', code: 'KES', symbol: 'KSh', decimals: 2 },
  { country: '加纳', currency: '塞地', code: 'GHS', symbol: 'GH₵', decimals: 2 },
  { country: '埃及', currency: '埃及镑', code: 'EGP', symbol: 'E£', decimals: 2 },
  { country: '摩洛哥', currency: '迪拉姆', code: 'MAD', symbol: 'MAD ', decimals: 2 },
  { country: '埃塞俄比亚', currency: '比尔', code: 'ETB', symbol: 'ETB ', decimals: 2 },
  { country: '坦桑尼亚', currency: '先令', code: 'TZS', symbol: 'TSh', decimals: 2 },
  { country: '乌干达', currency: '先令', code: 'UGX', symbol: 'USh', decimals: 2 },
  { country: '安哥拉', currency: '宽扎', code: 'AOA', symbol: 'AOA ', decimals: 2 },
  { country: '赞比亚', currency: '克瓦查', code: 'ZMW', symbol: 'ZMW ', decimals: 2 }
]

export const CURRENCY_BY_CODE = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]))

// Base currencies offered in the "from" dropdown (the common quoting set).
export const BASE_CODES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'SGD', 'AUD', 'ZAR', 'AED', 'RUB', 'INR', 'KRW', 'THB']

// Quick-quote table: the currencies sales staff price into most often.
export const QUICK_CODES = ['USD', 'EUR', 'GBP', 'ZAR', 'AED', 'SAR', 'IDR', 'VND', 'THB', 'MYR', 'INR', 'RUB', 'BRL', 'MXN', 'AUD', 'JPY', 'KRW', 'NGN', 'KES', 'EGP']

/** Format an amount in a currency: symbol + grouped digits at its decimals. */
export function formatMoney(amount, code) {
  const meta = CURRENCY_BY_CODE[code] || { symbol: `${code} `, decimals: 2 }
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  const text = n.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals
  })
  return `${meta.symbol}${text}`
}

/** Format an exchange rate readably: more decimals the smaller it gets. */
export function formatRate(rate) {
  const n = Number(rate)
  if (!Number.isFinite(n) || n <= 0) return '—'
  const digits = n >= 100 ? 4 : n >= 1 ? 6 : 8
  return String(Number(n.toFixed(digits)))
}
