const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChatResponse {
  answer: string;
  product_ids: string[];
  chat_id: string;
}
import { Product } from "@/components/product";
export interface ProductDetails {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  material?: string;
  features?: string[];
}

export async function registerUser(username: string, email: string, password: string) {
  const resp = await fetch(`${API}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export async function loginUser(username: string, password: string) {
  const resp = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function chatWithBackend(text: string, chatId?: string) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: text, chat_id: chatId }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<ChatResponse>;
}

export async function getProductDetails(productId: string): Promise<Product> {
  try {
    const resp = await fetch(`${API}/api/products/${productId}`);
    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${errorText}`);
    }
    
    const product = await resp.json();
    
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '/placeholder-product.jpg',
      dataAiHint: product.name,
      description: product.description,
      material: product.material,
      features: product.features || [],
      url: `/product/${product.id}`
    };
  } catch (error) {
    console.error('Error loading product:', error);
    return {
      id: productId,
      name: 'Product Unavailable',
      description: 'Could not load product details',
      price: 0,
      imageUrl: '/placeholder-product.jpg',
      dataAiHint: 'Unavailable product',
      material: '',
      features: [],
      url: '#'
    };
  }
}
export async function getChatSessions() {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API}/api/chat-sessions`, {
    headers: { 
      'Authorization': `Bearer ${token}`
    },
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<string[]>;
}

export async function getChatHistory(chatId: string) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API}/api/chat-history/${chatId}`, {
    headers: { 
      'Authorization': `Bearer ${token}`
    },
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<Array<{ prompt: string; response: string }>>;
}
export async function savePreferences(preferences: any) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API}/api/preferences`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(preferences),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to save preferences');
  }
  return resp.json();
}