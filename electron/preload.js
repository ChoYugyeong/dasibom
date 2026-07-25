const { contextBridge, ipcRenderer } = require('electron');

// 렌더러(웹 코드)에서 안전하게 쓰는 파일 저장 API.
// 이 객체(window.dasibom)의 존재 여부로 "데스크톱 앱 모드"를 판별한다.
contextBridge.exposeInMainWorld('dasibom', {
  load:        () => ipcRenderer.invoke('vault:load'),
  save:        (data) => ipcRenderer.invoke('vault:save', data),
  chooseVault: () => ipcRenderer.invoke('vault:choose'),
  vaultPath:   () => ipcRenderer.invoke('vault:path'),
  reveal:      () => ipcRenderer.invoke('vault:reveal'),
  fetchMeta:   (url) => ipcRenderer.invoke('meta:fetch', url)
});
