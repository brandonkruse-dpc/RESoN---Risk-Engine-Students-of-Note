
import { Student, BackendConfig } from '../types.ts';

/**
 * RE:SoN BRIDGE SERVICE
 * 
 * Refactored to support both 'Sync' (ManageBac -> Drive) 
 * and 'Fetch' (Drive -> UI).
 */

export const syncFromManageBac = async (bridgeUrl: string, config: BackendConfig): Promise<Student[]> => {
  try {
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'sync',
        domain: config.mbDomain,
        apiKey: config.mbApiKey,
        folderId: config.gDriveRawFolder
      })
    });
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message);
    return data.students || []; 
  } catch (error: any) {
    throw new Error("Sync Failed: " + error.message);
  }
};

export const fetchLatestFromDrive = async (bridgeUrl: string, folderUrl: string): Promise<Student[]> => {
  try {
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'fetch_latest',
        folderId: folderUrl
      })
    });
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message);
    return data.students || [];
  } catch (error: any) {
    throw new Error("Fetch Failed: " + error.message);
  }
};

export const BRIDGE_CODE_TEMPLATE = `/**
 * RE:SoN Bridge Proxy Script v2
 * 1. Create a new Google Apps Script project.
 * 2. Paste this code.
 * 3. Deploy > New Deployment.
 * 4. Type: Web App | Execute as: Me | Access: Anyone.
 */

function doPost(e) {
  const LOCK_TIMEOUT = 30000; // 30 seconds
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(LOCK_TIMEOUT);
    const params = JSON.parse(e.postData.contents);
    
    // ACTION: SYNC (ManageBac -> Drive)
    if (params.action === 'sync') {
      const headers = { 
        "Authorization": "Token token=" + params.apiKey,
        "Accept": "application/json"
      };
      
      const response = UrlFetchApp.fetch("https://" + params.domain + "/v2/students", { 
        headers: headers,
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() !== 200) {
        throw new Error("ManageBac API Error: " + response.getContentText());
      }
      
      const students = JSON.parse(response.getContentText()).students;

      if (params.folderId) {
        const folder = DriveApp.getFolderById(extractId(params.folderId));
        const fileName = "RESON_DATA_LATEST.json";
        
        // Update or Create the 'LATEST' file for quick retrieval
        const files = folder.getFilesByName(fileName);
        if (files.hasNext()) {
          files.next().setContent(JSON.stringify(students));
        } else {
          folder.createFile(fileName, JSON.stringify(students), MimeType.JSON);
        }
        
        // Also create a timestamped archive
        const archiveName = "ARCHIVE_" + Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd") + ".json";
        folder.createFile(archiveName, JSON.stringify(students), MimeType.JSON);
      }
      
      return createJsonResponse({ status: "success", students: students });
    }
    
    // ACTION: FETCH LATEST (Drive -> UI)
    if (params.action === 'fetch_latest') {
      const folder = DriveApp.getFolderById(extractId(params.folderId));
      const files = folder.getFilesByName("RESON_DATA_LATEST.json");
      
      if (files.hasNext()) {
        const content = files.next().getBlob().getDataAsString();
        return createJsonResponse({ status: "success", students: JSON.parse(content) });
      } else {
        return createJsonResponse({ status: "error", message: "No synced data found in folder." });
      }
    }

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function extractId(url) {
  if (url.indexOf('folders/') > -1) {
    return url.split('folders/')[1].split('?')[0];
  }
  return url;
}

function doGet(e) {
  return ContentService.createTextOutput("RE:SoN Bridge v2 is Active.");
}`;