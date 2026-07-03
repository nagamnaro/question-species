export interface PrivateMessageView {
  id: string;
  responseId: string;
  questionId: string;
  questionText: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  recipientName: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isSentByMe: boolean;
}

export interface PrivateMessagesByResponse {
  [responseId: string]: PrivateMessageView[];
}
