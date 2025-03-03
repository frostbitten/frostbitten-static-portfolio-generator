import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import stream from 'stream';
import { promisify } from 'util';
import extract from 'extract-zip';
import dotenv from 'dotenv';



// Load environment variables from .env file
dotenv.config();

// Promisify pipeline for easier file downloads
const pipeline = promisify(stream.pipeline);

// Environment variables needed in Netlify
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_DRIVE_FOLDER_ID
} = process.env;

// Ensure the work directory exists
const WORK_DIR = path.join(process.cwd(), 'work');
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

// Initialize the Google Drive API client
async function initDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  // Set the refresh token to enable headless authentication
  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}


async function downloadDriveFile(drive, fileId, filePath) {
	const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
	await pipeline(res.data, fs.createWriteStream(filePath));
	console.log(`Downloaded file to: ${filePath}`);
}

async function exportGoogleDocsFile(drive, file, filePath) {
	const exportMimeTypes = {
		'application/vnd.google-apps.document': 'application/pdf',
		'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.google-apps.presentation': 'application/pdf'
	};

	const exportMimeType = exportMimeTypes[file.mimeType] || 'application/pdf';

	const res = await drive.files.export({ fileId: file.id, mimeType: exportMimeType }, { responseType: 'stream' });
	await pipeline(res.data, fs.createWriteStream(filePath));
	console.log(`Exported ${file.name} as ${exportMimeType}`);
}

async function syncFilesFromDrive(drive, folderId, targetDir, tempDir) {
	console.log(`Listing files in folder: ${folderId}`);

	// Ensure target directory exists
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	// Get all files and folders in the target Google Drive folder
	const res = await drive.files.list({
		q: `'${folderId}' in parents and trashed=false`,
		fields: 'files(id, name, mimeType, size)',
	});

	if (!res.data.files.length) {
		console.log('No files found in the folder.');
		return;
	}

	for (const file of res.data.files) {
		const filePath = path.join(targetDir, file.name);
		const tempFilePath = path.join(tempDir, file.name);
		console.log(`Processing: ${file.name} (${file.id}) - ${file.mimeType}`);

		if (file.mimeType === 'application/vnd.google-apps.folder') {
			// Process subfolder recursively
			console.log(`Entering subfolder: ${file.name}`);
			await syncFilesFromDrive(drive, file.id, filePath, tempFilePath);
		} else {
			// Check if the file exists in the temp folder
			const fileExists = fs.existsSync(tempFilePath);
			const fileSize = fileExists ? fs.statSync(tempFilePath).size : 0;
			const remoteFileSize = file.size ? parseInt(file.size) : 0;

			if (fileExists && fileSize === remoteFileSize) {
				// Copy the unchanged file from temp
				fs.copyFileSync(tempFilePath, filePath);
				console.log(`Copied from temp: ${file.name}`);
			} else {
				// Download or export the file
				if (file.mimeType.startsWith('application/vnd.google-apps')) {
					await exportGoogleDocsFile(drive, file, filePath);
				} else {
					await downloadDriveFile(drive, file.id, filePath);
				}
			}
		}
	}
	console.log(`Completed processing folder: ${targetDir}`);
}

// Helper function to move WORK_DIR to a temp location
function moveWorkDirToTemp() {
	const tempDir = path.join(process.cwd(), 'work_temp');
	if (fs.existsSync(WORK_DIR)) {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true });
		}
		fs.renameSync(WORK_DIR, tempDir);
	}
	return tempDir;
}

// Cleanup function to delete temp folder
function deleteTempFolder(tempDir) {
	if (fs.existsSync(tempDir)) {
		fs.rmSync(tempDir, { recursive: true });
		console.log('Temporary folder deleted.');
	}
}

// Main function
async function pullGDriveFolder() {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GOOGLE_DRIVE_FOLDER_ID) {
		console.error('Missing required environment variables.');
		process.exit(1);
	}

	console.log('Initializing Google Drive API client...');
	const drive = await initDriveClient();

	console.log(`Pulling folder from Google Drive: ${GOOGLE_DRIVE_FOLDER_ID}`);

	// Move existing work directory to temp
	const tempDir = moveWorkDirToTemp();

	try {
		await syncFilesFromDrive(drive, GOOGLE_DRIVE_FOLDER_ID, WORK_DIR, tempDir);
		console.log('Successfully downloaded and synchronized folder.');

		// Cleanup temp folder
		deleteTempFolder(tempDir);
	} catch (error) {
		console.error('Failed to sync Google Drive folder:', error.message);
		process.exit(1);
	}
}


// Run the script
pullGDriveFolder();