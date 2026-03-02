export function fetchJSONP(url, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const cbName = `__jsonp_cb_${Math.random().toString(36).slice(2)}`;
    const sep = url.includes("?") ? "&" : "?";
    const fullUrl = `${url}${sep}callback=${cbName}&_=${Date.now()}`;

    const script = document.createElement("script");
    script.src = fullUrl;
    script.async = true;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      script.remove();
    }

    window[cbName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP network error"));
    };

    document.head.appendChild(script);
  });
}
