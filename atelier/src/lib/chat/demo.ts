import type { ChatThread, ChatMessage } from "./types";

export const DEMO_THREADS: ChatThread[] = [
  {
    id: "demo-thread-1",
    participant_a: "demo-you",
    participant_b: "00000000-0000-4000-a000-000000000001",
    other_id: "00000000-0000-4000-a000-000000000001",
    other_handle: "ines",
    other_name: "In\u00eas Almeida",
    last_message: "Would love to see the full set when you\u2019re done",
    last_message_at: "2026-07-08T14:30:00Z",
    created_at: "2026-07-07T10:00:00Z",
    is_request: true,
  },
  {
    id: "demo-thread-2",
    participant_a: "demo-you",
    participant_b: "00000000-0000-4000-a000-000000000002",
    other_id: "00000000-0000-4000-a000-000000000002",
    other_handle: "theo",
    other_name: "Theo Brandt",
    last_message: "The kiln should be ready by Friday",
    last_message_at: "2026-07-08T09:15:00Z",
    created_at: "2026-07-06T16:00:00Z",
    is_request: false,
  },
];

export const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  "demo-thread-1": [
    {
      id: "demo-msg-1",
      thread_id: "demo-thread-1",
      sender_id: "00000000-0000-4000-a000-000000000001",
      body: "Hey! Just uploaded some new darkroom scans.",
      created_at: "2026-07-07T10:05:00Z",
    },
    {
      id: "demo-msg-2",
      thread_id: "demo-thread-1",
      sender_id: "demo-you",
      body: "Nice, can\u2019t wait to see them!",
      created_at: "2026-07-07T10:10:00Z",
    },
    {
      id: "demo-msg-3",
      thread_id: "demo-thread-1",
      sender_id: "00000000-0000-4000-a000-000000000001",
      body: "Would love to see the full set when you\u2019re done",
      created_at: "2026-07-08T14:30:00Z",
    },
  ],
  "demo-thread-2": [
    {
      id: "demo-msg-4",
      thread_id: "demo-thread-2",
      sender_id: "demo-you",
      body: "Hey Theo, any new ceramic pieces coming?",
      created_at: "2026-07-06T16:05:00Z",
    },
    {
      id: "demo-msg-5",
      thread_id: "demo-thread-2",
      sender_id: "00000000-0000-4000-a000-000000000002",
      body: "Working on a new set of vases. The kiln should be ready by Friday.",
      created_at: "2026-07-08T09:15:00Z",
    },
  ],
};
