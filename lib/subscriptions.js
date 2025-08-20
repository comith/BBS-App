// lib/subscriptions.js
let subscriptions = [];

export const getSubscriptions = () => {
  console.log(`Current subscriptions count: ${subscriptions.length}`);
  return subscriptions;
};

export const addSubscription = (subscription, timestamp) => {
  const existingIndex = subscriptions.findIndex(
    sub => sub.subscription.endpoint === subscription.endpoint
  );
  
  if (existingIndex !== -1) {
    subscriptions[existingIndex] = { subscription, timestamp };
    console.log('Updated existing subscription');
  } else {
    subscriptions.push({ subscription, timestamp });
    console.log('Added new subscription');
  }
  
  console.log(`Total subscriptions: ${subscriptions.length}`);
  console.log('Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
  return subscriptions.length;
};

export const removeSubscription = (endpoint) => {
  const index = subscriptions.findIndex(
    sub => sub.subscription.endpoint === endpoint
  );
  
  if (index !== -1) {
    subscriptions.splice(index, 1);
    console.log('Removed subscription');
  }
  
  return subscriptions.length;
};

export const clearExpiredSubscriptions = () => {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const initialLength = subscriptions.length;
  
  subscriptions = subscriptions.filter(sub => {
    const timestamp = new Date(sub.timestamp).getTime();
    return timestamp > oneWeekAgo;
  });
  
  console.log(`Cleared ${initialLength - subscriptions.length} expired subscriptions`);
  return subscriptions.length;
};

export const getAllSubscriptionsInfo = () => {
  return {
    total: subscriptions.length,
    subscriptions: subscriptions.map((sub, index) => ({
      index,
      endpoint: sub.subscription.endpoint.substring(0, 50) + '...',
      timestamp: sub.timestamp
    }))
  };
};