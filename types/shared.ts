export interface HeaderProps {
    user?: any;
    rows?: any[];
    logout: () => void;
    toggleSidebar?: () => void;
    CurrencySelector: React.ComponentType;
    ThemeToggle: React.ComponentType;
    handleAddRow: () => void;
    farmName:String
}

export interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    rows: any[];
    logout: () => void;
    handleRowAdded: () => void;
    hasFarm: boolean;
}