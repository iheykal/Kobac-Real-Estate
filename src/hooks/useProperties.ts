import { useState, useEffect, useCallback } from 'react';
import { propertyEventManager, PropertyEventType } from '@/lib/propertyEvents';

export interface Property {
  _id: string;
  propertyId?: number;
  title: string;
  location: string;
  district: string; // Add district field
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: string;
  status: string;
  listingType?: string;
  description: string;
  features: string[];
  amenities: string[];
  images: string[];
  agentId?: string; // Add agentId field
  agent: {
    name: string;
    phone: string;
    image: string;
    rating: number;
  };
  featured: boolean;
  viewCount?: number;
  uniqueViewCount?: number;
  deletionStatus?: 'active' | 'pending_deletion' | 'deleted'; // Add deletionStatus field
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  listingType: 'all' | 'sale' | 'rent'
  district: string
}

export const useProperties = (featured?: boolean, filters?: FilterOptions) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (featured) {
        params.append('featured', 'true');
      }
      
      // Add filter parameters
      if (filters) {
        if (filters.listingType && filters.listingType !== 'all') {
          params.append('listingType', filters.listingType);
        }
        if (filters.district) {
          params.append('district', filters.district);
        }
      }
      
      const response = await fetch(`/api/properties?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.data);
      } else {
        setError(data.error || 'Failed to fetch properties');
      }
    } catch (err) {
      setError('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [featured, filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Listen for property events
  useEffect(() => {
    const unsubscribe = propertyEventManager.subscribe((eventType, propertyId) => {
      console.log('🔔 useProperties received event:', { eventType, propertyId });
      switch (eventType) {
        case 'deleted':
          if (propertyId) {
            console.log('🗑️ Removing property from list:', propertyId);
            setProperties(prev => prev.filter(prop => prop._id !== propertyId));
          }
          break;
        case 'updated':
          console.log('🔄 Refreshing properties due to update event');
          // Refresh properties to get updated data
          fetchProperties();
          break;
        case 'added':
          console.log('➕ Refreshing properties due to add event');
          // Refresh properties to get new data
          fetchProperties();
          break;
        case 'refresh':
          console.log('🔄 Force refreshing properties');
          // Force refresh
          fetchProperties();
          break;
      }
    });

    return unsubscribe;
  }, [fetchProperties]);

  const addProperty = async (propertyData: Omit<Property, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();
      
      if (data.success) {
        setProperties(prev => [data.data, ...prev]);
        // Notify other components about the addition
        propertyEventManager.notifyAdded(data.data._id);
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to add property' };
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        setProperties(prev => 
          prev.map(prop => 
            prop._id === id ? { ...prop, ...data.data } : prop
          )
        );
        // Notify other components about the update
        propertyEventManager.notifyUpdated(id);
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update property' };
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setProperties(prev => prev.filter(prop => prop._id !== id));
        // Notify other components about the deletion
        propertyEventManager.notifyDeleted(id);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete property' };
    }
  };

  return {
    properties,
    loading,
    error,
    addProperty,
    updateProperty,
    deleteProperty,
  };
};
