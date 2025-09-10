import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (fetchFunction, initialParams = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const observer = useRef();
  const isInitialLoad = useRef(true);

  // Reset function pour réinitialiser l'état
  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotalCount(0);
    isInitialLoad.current = true;
  }, []);

  // Fonction pour charger les données
  const loadMore = useCallback(async (pageNumber = 1, shouldAppend = true) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFunction({
        ...initialParams,
        page: pageNumber,
        limit: initialParams.limit || 12
      });
      
      const newItems = response.data.files || response.data || [];
      const pagination = response.data.pagination;
      
      if (shouldAppend && pageNumber > 1) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      
      if (pagination) {
        setTotalCount(pagination.total);
        setHasMore(pageNumber < pagination.totalPages);
      } else {
        // Si pas de pagination, on suppose qu'il n'y a qu'une page
        setTotalCount(newItems.length);
        setHasMore(false);
      }
      
      setPage(pageNumber);
      
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Erreur useInfiniteScroll:', err);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [fetchFunction, initialParams, loading]);

  // Charger la première page au montage
  useEffect(() => {
    if (isInitialLoad.current) {
      loadMore(1, false);
    }
  }, [loadMore]);

  // Fonction pour charger la page suivante
  const loadNextPage = useCallback(() => {
    if (!loading && hasMore) {
      loadMore(page + 1, true);
    }
  }, [loading, hasMore, page, loadMore]);

  // Ref callback pour l'intersection observer
  const lastItemRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadNextPage();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadNextPage]);

  // Fonction pour rafraîchir les données
  const refresh = useCallback(() => {
    reset();
    setTimeout(() => {
      loadMore(1, false);
    }, 0);
  }, [reset, loadMore]);

  return {
    items,
    loading,
    hasMore,
    error,
    page,
    totalCount,
    lastItemRef,
    loadNextPage,
    refresh,
    reset
  };
};

export default useInfiniteScroll;
