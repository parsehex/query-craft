import { useState, useEffect, useRef, ChangeEvent, MouseEvent } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Prompt_Part } from '../../../types';
import { getTokenCount, updatePromptPart } from '../../api';
import { useStore } from '../../state';

interface UsePromptPartStateProps {
	promptPart: Prompt_Part;
	onSelect: (promptPart: Prompt_Part) => void;
	onCheckboxChange: (
		event: React.ChangeEvent<HTMLInputElement>,
		promptPart: Prompt_Part
	) => void;
	movePromptPart: (dragIndex: number, hoverIndex: number) => void;
	index: number;
	ref: React.RefObject<HTMLDivElement>;
}

export const usePromptPartState = ({
	promptPart,
	onSelect,
	onCheckboxChange,
	movePromptPart,
	index,
	ref,
}: UsePromptPartStateProps) => {
	const setPromptPart = useStore((state) => state.setPromptPart);
	const returnObj = { isDragging: false };
	const [menuOpen, setMenuOpen] = useState(false);
	const [tokenCount, setTokenCount] = useState(0);

	useEffect(() => {
		getTokenCount({ promptPartId: promptPart.id }).then((data) => {
			if (!data) return;
			setTokenCount(data.token_count);
		});
	}, [promptPart]);

	if (promptPart.part_type === 'snippet') {
		const [, drop] = useDrop({
			accept: 'prompt-part',
			drop: async (item: any, monitor) => {
				if (!ref.current) return;
				const dragIndex = item.index;
				const hoverIndex = index;
				if (dragIndex === hoverIndex) return;
				await movePromptPart(dragIndex, hoverIndex);
				item.index = hoverIndex;
			},
		});
		const [{ isDragging }, drag] = useDrag({
			item: { type: 'prompt-part', id: promptPart.id, index },
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			type: 'prompt-part',
		});
		returnObj['isDragging'] = isDragging;

		drag(drop(ref));
	}

	const handleContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		setMenuOpen(true);
	};

	const handleOnSelect = () => {
		onSelect(promptPart);
	};

	const handleNameChange = async (newName: string) => {
		if (newName !== promptPart.name) {
			promptPart.name = newName;
			promptPart = (await updatePromptPart(promptPart.id, { name: newName }))
				.promptPart;
			setPromptPart(promptPart);
		}
	};

	const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
		onCheckboxChange(event, promptPart);
		event.stopPropagation();
	};
	const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>) => {
		event.stopPropagation();
	};

	return {
		menuOpen,
		setMenuOpen,
		handleContextMenu,
		handleOnSelect,
		handleNameChange,
		handleCheckboxChange,
		handleCheckboxClick,
		tokenCount,
		...returnObj,
	};
};
