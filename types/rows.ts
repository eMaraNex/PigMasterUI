export interface Row {
  id?: string;
  name: string;
  farm_id?: string;
  description?: string;
  capacity: number;
  occupied: number;
  is_deleted: number;
  levels: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AddRowDialogProps {
  open: boolean;
  onClose: () => void;
  onRowAdded?: () => void;
  rowToEdit?: Row | null;
}


export interface RowBannerProps {
    onRowAdded: () => void;
}

export interface RowCreationModalProps {
    isOpen: boolean;
    onClose: (skip?: boolean) => void;
    onRowAdded: () => void;
}
    
