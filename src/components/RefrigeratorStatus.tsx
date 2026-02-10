import React from 'react';
import type { RefrigeratorItem } from '../types';

interface RefrigeratorStatusProps {
  items: RefrigeratorItem[];
}

export const RefrigeratorStatus: React.FC<RefrigeratorStatusProps> = ({ items }) => {
  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, RefrigeratorItem[]>);

  // Calculate expiration warnings
  const getExpirationStatus = (item: RefrigeratorItem): 'expired' | 'expiring' | 'good' => {
    if (!item.expirationDate) return 'good';
    
    const today = new Date();
    const expDate = new Date(item.expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';
    return 'good';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Refrigerator Status</h2>

      {items.length === 0 ? (
        <p className="text-secondary">No items in refrigerator. Add items to track their status.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="mb-4">
              <h3 className="text-lg font-medium text-primary mb-3 capitalize">
                {category}
              </h3>
              <ul className="space-y-2">
                {categoryItems.map((item) => {
                  const status = getExpirationStatus(item);
                  
                  return (
                    <li 
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded border ${
                        status === 'expired' ? 'border-danger bg-danger-50' :
                        status === 'expiring' ? 'border-warning bg-warning-50' :
                        'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className={`font-medium ${
                            status === 'expired' ? 'text-danger' :
                            status === 'expiring' ? 'text-warning' :
                            'text-primary'
                          }`}>
                            {item.name}
                          </span>
                          <span className="text-sm text-secondary ml-2">
                            {item.quantity} {item.unit}
                          </span>
                          {item.expirationDate && (
                            <span className={`text-xs block ${
                              status === 'expired' ? 'text-danger' :
                              status === 'expiring' ? 'text-warning' :
                              'text-gray-500'
                            }`}>
                              {status === 'expired' ? 'Expired' : 
                               status === 'expiring' ? `Expires in ${Math.ceil((new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` :
                               `Expires: ${item.expirationDate.toDateString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.notes && (
                        <span className="text-xs text-gray-500">
                          {item.notes}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};