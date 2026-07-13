export interface ChatThread {
  id: string;
  participant_a: string;
  participant_b: string;
  /** The other person — resolved at query time based on viewer id. */
  other_id: string;
  other_handle: string;
  other_name: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  /** true when this is a pending contact request FOR the viewer (they're the
      recipient of a non-mutual first contact and haven't accepted yet). */
  is_request: boolean;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
