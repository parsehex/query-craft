import * as React from 'react';
import { useState, useEffect } from 'react';
import { encode } from 'gpt-tokenizer';
import Editor from './Editor';
import DraggablePromptPart from './DraggablePromptPart';

export interface Project {
	id: number;
	name: string;
	description: string;
	ignore_files: string;
	created_at: string;
}

export interface Prompt_Part {
	id: number;
	project_id: number;
	content: string;
	name: string;
	snippet: boolean;
	part_type: 'file' | 'snippet';
	token_count: number;
	included: boolean;
	position: number;
	created_at: string;
	updated_at: string;
}

export const App: React.FC = () => {
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
		null
	);
	const [promptParts, setPromptParts] = useState<Prompt_Part[]>([]);
	const [selectedPromptPart, setSelectedPromptPart] =
		useState<Prompt_Part | null>(null);

	const gptTokenCache = new Map<string, string>();

	useEffect(() => {
		// Fetch projects here and update the 'projects' state
		const fetchProjects = async () => {
			const response = await fetch('/api/projects');
			const data = await response.json();
			setProjects(data);

			// Check for a stored project ID in localStorage
			const storedProjectId = localStorage.getItem('selectedProjectId');
			if (storedProjectId) {
				setSelectedProjectId(Number(storedProjectId));
			}
		};
		fetchProjects();
	}, []);

	useEffect(() => {
		if (selectedProjectId) {
			// Fetch prompt parts for the selected project and update the 'promptParts' state
			const fetchPromptParts = async () => {
				const response = await fetch(`/api/prompt_parts/${selectedProjectId}`);
				const data = await response.json();
				setPromptParts(data);
			};
			fetchPromptParts();
		}
	}, [selectedProjectId]);

	const handleProjectSelection = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		const projectId = Number(event.target.value);
		setSelectedProjectId(projectId);

		// Store the selected project ID in localStorage
		localStorage.setItem('selectedProjectId', projectId.toString());
	};

	const movePromptPart = async (dragIndex: number, hoverIndex: number) => {
		const dragPromptPart = promptParts[dragIndex];
		const updatedPromptParts = [...promptParts];
		updatedPromptParts.splice(dragIndex, 1);
		updatedPromptParts.splice(hoverIndex, 0, dragPromptPart);

		// Update the position property of each prompt part
		updatedPromptParts.forEach((part, index) => {
			part.position = index;
		});

		// Save the updated positions to the database
		for (const promptPart of updatedPromptParts) {
			await fetch(`/api/prompt_parts/${promptPart.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ position: promptPart.position }),
			});
		}

		setPromptParts(updatedPromptParts);
	};

	const handlePromptPartClick = (promptPart: Prompt_Part) => {
		setSelectedPromptPart(promptPart);
	};

	const handleCheckboxChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
		promptPart: Prompt_Part
	) => {
		const isChecked = event.target.checked;
		// Update included value in the database
		const response = await fetch(`/api/prompt_parts/${promptPart.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ included: isChecked }),
		});
		if (response.ok) {
			// Update included value in the local state
			setPromptParts((prevPromptParts) =>
				prevPromptParts.map((pp) =>
					pp.id === promptPart.id ? { ...pp, included: isChecked } : pp
				)
			);
		}
	};

	const handleNewSnippetClick = async () => {
		// Add logic to create a new snippet
		const name = 'New Snippet';
		const response = await fetch(`/api/prompt_parts`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name,
				content: '',
				project_id: selectedProjectId,
				part_type: 'snippet',
			}),
		});
		if (response.ok) {
			const data = await response.json();
			setPromptParts((prevPromptParts) => [
				...prevPromptParts,
				data.promptPart,
			]);
		}
	};

	const handleEditorSave = async (newContent: string) => {
		if (!selectedPromptPart) return;
		await fetch(`/api/prompt_parts/${selectedPromptPart.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: newContent }),
		});
		setPromptParts((prevPromptParts) =>
			prevPromptParts.map((pp) =>
				pp.id === selectedPromptPart.id ? { ...pp, content: newContent } : pp
			)
		);
	};

	const copyPromptToClipboard = () => {
		const prompt = promptParts
			.filter((part) => part.included)
			.map((part) => part.name + ':\n' + part.content)
			.join('\n\n');
		navigator.clipboard.writeText(prompt);
	};

	return (
		<div className="app">
			<header className="app-header">
				<h1>Prompt Builder</h1>
			</header>
			<main className="app-main">
				<div className="sidebar">
					<div className="project-selector">
						<select
							value={selectedProjectId || ''}
							onChange={handleProjectSelection}
						>
							<option value="">Select a project</option>
							{projects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>
						<button className="edit-project">Edit Project</button>
					</div>
					<button onClick={handleNewSnippetClick}>+ Snippet</button>
					<button onClick={copyPromptToClipboard}>
						Copy Prompt to Clipboard
					</button>
					<ul id="prompt-parts">
						{promptParts
							.sort((a, b) => a.position - b.position)
							.map((promptPart, index) => (
								<DraggablePromptPart
									key={promptPart.id}
									index={index}
									promptPart={promptPart}
									onClick={handlePromptPartClick}
									onCheckboxChange={handleCheckboxChange}
									movePromptPart={movePromptPart}
								/>
							))}
					</ul>
				</div>
				<div className="right-sidebar">
					{selectedPromptPart && (
						<div>
							<h2>Editing: {selectedPromptPart.name}</h2>
							<Editor
								initialContent={selectedPromptPart.content}
								onContentChange={(newContent) => {
									// Logic to handle content change
								}}
								onSave={handleEditorSave}
							/>
						</div>
					)}
				</div>
			</main>
		</div>
	);
};
