export interface DisplaySession {
  id: string;
  groupId: string;
  groupCode: string;
  projectTitle: string | null;
  date: string;
  start: string;
  end: string;
  timeslotId: string;
  roomId: string | null;
  roomCode: string;
  reviewers: { id: string; name: string }[];
  status: string;
}
