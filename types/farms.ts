
export interface FarmBannerProps {
    onFarmCreated: () => void;
}

export interface FarmCreationModalProps {
    isOpen: boolean;
    onClose: (skip?: boolean) => void;
    onFarmCreated: () => void;
}
    