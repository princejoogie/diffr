import React, {useMemo, useState} from 'react';
import {Text, Box, useInput} from 'ink';
import {spawnSync} from 'child_process';
import {Select} from '@inkjs/ui';

export type Props = {
	name: string | undefined;
};

const cmd = {
	getHashes: () => {
		const command = 'git log --pretty=format:"%h{SEPARATOR}%s"';
		const raw = spawnSync(command, {shell: true});
		const output = raw.stdout
			.toString()
			.split('\n')
			.filter(e => e.trim() !== '')
			.map(e => {
				const [hash, message] = e.split('{SEPARATOR}');
				if (!hash || !message) {
					throw new Error('Invalid git log output');
				}

				return {hash, message};
			});

		return output;
	},
	getFiles: (hash: string) => {
		const command = `git diff --name-only ${hash}`;
		const raw = spawnSync(command, {shell: true});
		const output = raw.stdout
			.toString()
			.split('\n')
			.filter(e => e.trim() !== '');
		return output;
	},
	getDiff: (hash: string, file: string) => {
		const command = `git diff ${hash} ${file} | delta`;
		const raw = spawnSync(command, {shell: true});
		const output = raw.stdout.toString();
		return output;
	},
};

export default function App(_props: Props) {
	const [selectedHash, setSelectedHash] = useState('');
	const [selectedFile, setSelectedFile] = useState('');

	const hashes = useMemo(() => cmd.getHashes(), []);

	const files = useMemo(() => {
		if (!selectedHash) return [];
		const files = cmd.getFiles(selectedHash);
		if (files[0]) {
			setSelectedFile(files[0]);
		}
		return files;
	}, [selectedHash]);

	const diff = useMemo(() => {
		if (!selectedHash || !selectedFile) return;
		return cmd.getDiff(selectedHash, selectedFile);
	}, [selectedHash, selectedFile]);

	useInput((_, key) => {
		if (key.escape) {
			console.clear();
			setSelectedHash('');
			setSelectedFile('');
		}
	});

	return (
		<Box flexDirection="column" padding={2}>
			<Box marginBottom={2}>
				<Text bold backgroundColor="white" color="black">
					Welcome to diffr - by @princejoogie
				</Text>
			</Box>

			<Box flexDirection="row" width="100%">
				<Box flexDirection="column" width="40%">
					{!selectedHash ? (
						<>
							<Text>Choose a commit hash:</Text>

							<Select
								visibleOptionCount={10}
								key="hash-select"
								options={hashes.map(e => ({
									label: `${e.hash} - ${e.message}`,
									value: e.hash,
								}))}
								onChange={e => {
									setSelectedHash(e);
									console.clear();
								}}
							/>
						</>
					) : files.length > 0 ? (
						<Box flexDirection="column" overflow="hidden">
							<Text>Choose a file:</Text>

							<Select
								visibleOptionCount={10}
								key="file-select"
								options={files.map(e => ({label: e, value: e}))}
								onChange={e => {
									setSelectedFile(e);
									console.clear();
								}}
							/>
						</Box>
					) : (
						<Text>{'No files changed. Press <ESC> to go back'}</Text>
					)}
				</Box>

				<Box
					flexDirection="row"
					flexGrow={1}
					width="60%"
					borderStyle="round"
					borderColor="white"
					alignItems="stretch"
					justifyContent="center"
				>
					{diff ? (
						<Text>{diff}</Text>
					) : (
						<Text>Select a hash and file to view the diff</Text>
					)}
				</Box>
			</Box>
		</Box>
	);
}
