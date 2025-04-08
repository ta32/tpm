import { useState, useEffect } from 'react';

export function useDropboxWindowOauthParams() {
  const [search, setSearch] = useState("");
  const [codeVerifier, setCodeVerifier] = useState<string|null>("");

  useEffect(() => {
    const locationSearch = window.location.search;
    let codeVerifier = window.sessionStorage.getItem('codeVerifier');
    setSearch(locationSearch);
    setCodeVerifier(codeVerifier);
    // refreshing the page will cause errors in subsequent attempts to connect to Dropbox
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return { search, codeVerifier };
}