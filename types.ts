export interface Equipment {
  id: string;
  equipmentType: string;
  equipmentNumber: string;
  make: string;
  modelNumber: string;
  serialNumber: string;
  power: string;
  branchLocation: string;
  arabicName?: string;
  condition?: 'Working' | 'Ready for work' | 'Damage' | 'Other';
}

export interface OilLog {
  id: string;
  equipmentId: string;
  driverName: string;
  mileage: string;
  location: string;
  oilTypes: string[]; // Engine oil, Gear oil, etc.
  filters: string[]; // Air filter, Diesel filter, etc.
  date: string;
  time: string;
}

export interface Workshop {
  id: string;
  subName: string;
  foreman: string;
  location: string;
  mechanic?: string;
  arabicName?: string;
}

export interface Fault {
  id:string;
  description: string;
  workshopId: string;
  mechanicName?: string;
  workDone?: string;
  partsUsed?: { id: string; name: string; quantity: string }[];
}

export interface RepairRequest {
  id: string;
  equipmentId: string;
  driverName: string;
  mileage?: string;
  purpose: string; // Made flexible to match UI options
  faults: Fault[];
  dateIn: string;
  timeIn: string;
  dateOut?: string;
  timeOut?: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  applicationStatus: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  workshopId?: string;
  createdBy?: string;
  workDone?: string;
  partsUsed?: string;
  fromLocation?: string;
  toLocation?: string;
  applicationType?: string;
  rejectionReason?: string;
  acceptedBy?: string;
  approvalDate?: string;
}

export interface TransferRequest {
  id: string;
  equipmentId: string;
  fromLocation: string;
  toLocation: string;
  requesterName: string;
  reason: string;
  remarks: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  dateRequested: string;
  dateAccepted?: string;
  acceptedBy?: string;
  approver?: string;
  rejectionReason?: string;
  requesterId?: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  siteManager: string;
  workshopManager: string;
  hasWorkshop: boolean;
}

export interface User {
  id: string; // This will be the username
  password: string;
  role: 'admin' | 'user' | 'Manager' | 'Site Manager' | 'Workshop Foreman' | 'Other';
  location?: string;
  status: 'pending' | 'active';
  fullName?: string;
}

export interface Settings {
  jobCardStartNumber?: number;
}