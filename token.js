// === DARKSOL TOKEN DASHBOARD ===
(function () {
  const PRICE_API = 'https://darksol-price-api.chris00claw.workers.dev/';

  function formatUsd(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '--';
    if (n < 0.01) return `$${n.toFixed(6)}`;
    if (n < 1) return `$${n.toFixed(4)}`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function updateTokenPrice(price, change) {
    const formatted = formatUsd(price);
    const ch = Number(change) || 0;
    const changeText = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}% 24h`;
    const changeClass = ch >= 0 ? 'positive' : 'negative';

    setText('token-price', formatted);
    setText('terminal-price', formatted);
    setText('nav-price-value', formatted);
    setText('token-price-change', changeText);
    setText('nav-price-change', changeText);

    ['token-price-change', 'nav-price-change'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.className = `${id === 'nav-price-change' ? 'nav-price-change ' : ''}${changeClass}`;
    });
  }

  async function fetchTokenData() {
    try {
      const response = await fetch(PRICE_API, { cache: 'no-store' });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const price = data.price?.usd ?? data.usd ?? data.price;
      const change = data.price?.change_24h ?? data.change_24h ?? data.change24h ?? 0;
      updateTokenPrice(price, change);

      const volume = data.volume_24h ?? data.price?.volume_24h ?? data.volume24h;
      if (volume) setText('token-volume', formatUsd(volume));

      const marketCap = data.market_cap ?? data.price?.market_cap ?? data.marketCap;
      if (marketCap) setText('token-mcap', formatUsd(marketCap));
    } catch (error) {
      console.warn('Token dashboard fetch failed:', error);
      setText('token-price', 'Unavailable');
      setText('terminal-price', 'offline');
      setText('nav-price-value', 'Chart');
    }
  }

  fetchTokenData();
  setInterval(fetchTokenData, 60000);
})();
