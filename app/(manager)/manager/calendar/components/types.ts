export interface DisplaySession {
  id: number;
  groupId: number;
  groupCode: string;
  projectTitle: string | null;
  date: string;
  start: string;
  end: string;
  timeslotId: number;
  roomId: number;
  roomCode: string;
  reviewers: { id: number; name: string }[];
  resultOwnerIds: number[];
  status: string;
}

export interface MoveTarget {
  timeslotId: number;
  roomId: number;
  date: string;
  start: string;
  end: string;
}
