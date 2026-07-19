import { useCallback, useEffect, useMemo, useState } from "react";
import { getFaskes, getKategori } from "../api.js";

// Hook pemuat data faskes + kategori, dipakai bersama halaman publik & admin.
export function useFaskes() {
  const [kategoriList, setKategoriList] = useState([]);
  const [allFaskes, setAllFaskes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([getKategori(), getFaskes()])
      .then(([kat, fc]) => {
        setKategoriList(kat);
        setAllFaskes(fc.features);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reloadFaskes = useCallback(async () => {
    const fc = await getFaskes();
    setAllFaskes(fc.features);
  }, []);

  const counts = useMemo(() => {
    const c = {};
    allFaskes.forEach((f) => {
      const k = f.properties.kategori;
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [allFaskes]);

  return { kategoriList, allFaskes, counts, loading, error, reloadFaskes };
}
