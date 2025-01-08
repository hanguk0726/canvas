import { useState } from 'react';

interface ModalState {
    editorImage: string | null;
}

export const useModal = () => {
    const [state, setState] = useState<ModalState>({
        editorImage: null
    });

    const openEditor = (image: string) =>
        setState({ editorImage: image });

    const closeModals = () =>
        setState({ editorImage: null });

    return {
        editorImage: state.editorImage,
        openEditor,
        closeModals
    };
};
