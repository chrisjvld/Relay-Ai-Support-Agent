export type OrderStatus =
  | "processing"
  | "shipped"
  | "delivered"
  | "delayed"
  | "returned";

export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketSentiment = "positive" | "neutral" | "frustrated" | "angry";
export type TicketCategory =
  | "delivery"
  | "refund"
  | "return"
  | "warranty"
  | "product"
  | "other";

export interface OrderItem {
  name: string;
  variant: string;
  quantity: number;
}

export interface OrderEvent {
  label: string;
  timestamp: string;
  location?: string;
}

export interface Order {
  orderNumber: string;
  email: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  orderedAt: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  statusNote: string;
  statusHistory: OrderEvent[];
}

export interface KnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  updatedAt: string;
  content: string;
}

export interface KnowledgeChunk {
  articleId: string;
  slug: string;
  title: string;
  category: string;
  chunkId: string;
  text: string;
  embedding: number[];
}

export interface KnowledgeSource {
  articleId: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  score: number;
}

export interface SupportMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "resolved_by_ai" | "escalated";
  subject: string;
  customerName?: string;
  customerEmail?: string;
  orderNumber?: string;
  messages: SupportMessage[];
  sources: Pick<KnowledgeSource, "articleId" | "slug" | "title" | "category">[];
  toolsUsed: string[];
  ticketId?: string;
}

export interface Ticket {
  id: string;
  conversationId: string;
  createdAt: string;
  status: "open" | "in_progress" | "resolved";
  category: TicketCategory;
  priority: TicketPriority;
  sentiment: TicketSentiment;
  summary: string;
  latestMessage: string;
  customerEmail?: string;
  orderNumber?: string;
}

export interface DashboardData {
  stats: {
    conversations: number;
    resolvedByAi: number;
    resolutionRate: number;
    escalations: number;
  };
  tickets: Ticket[];
  conversations: Conversation[];
}
