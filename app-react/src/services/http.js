export async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
  return response.json()
}

export async function fetchJsonp(url) {
  const callback = `cb_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => reject(new Error('Timeout JSONP')), 10000)

    window[callback] = (data) => {
      clearTimeout(timeout)
      resolve(data)
      cleanup()
    }

    function cleanup() {
      delete window[callback]
      script.remove()
    }

    script.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('JSONP indisponible'))
      cleanup()
    }

    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callback}`
    document.body.appendChild(script)
  })
}
