// ==UserScript==
// @name         Crack Chat Downloader (크랙 채팅 다운로더)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  크랙 캐릭터 채팅의 대화를 HTML, TXT, JSON 파일로 저장하고 클립보드에 복사
// @author       kktcct001
// @match        https://crack.wrtn.ai/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// ==/UserScript==

(function() {
    'use strict';

    const ICONS = {
        chat: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/><path d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8m0 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>`,
        arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 12a.5.5 0 0 1-.5-.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5a.5.5 0 0 1-.5-.5z"/></svg>`,
        arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/></svg>`
    };

    GM_addStyle(`
        .chat-log-downloader-btn-desktop {
            display: flex; align-items: center; justify-content: center; height: 34px;
            padding: 0 12px; margin: 0 8px; border-radius: 8px; cursor: pointer;
            font-size: 14px; font-weight: 600; color: #FF4432; background-color: #FFFFFF;
            border: 1px solid #FF4432; white-space: nowrap; gap: 6px;
        }
        .chat-log-downloader-btn-desktop .icon-box {
            display: flex; justify-content: center; align-items: center;
            width: 16px; height: 16px; background-color: transparent;
        }
        .chat-log-downloader-btn-desktop svg { font-size: 16px; color: #FF4432; }

        .chat-log-downloader-btn-mobile {
            display: flex; align-items: center; justify-content: center; height: 48px;
            padding: 0 12px; margin: 16px; border-radius: 8px; cursor: pointer;
            font-size: 16px; font-weight: 600; color: #FF4432; background-color: #FFFFFF;
            border: 1px solid #FF4432; white-space: nowrap; gap: 8px;
            margin-top: auto;
        }
        .chat-log-downloader-btn-mobile .icon-box {
            display: flex; justify-content: center; align-items: center;
        }
        .chat-log-downloader-btn-mobile svg { font-size: 20px; color: #FF4432; }

        .downloader-panel-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.6); display: flex;
            justify-content: center; align-items: center; z-index: 9999;
        }
        .downloader-panel {
            background-color: #FFFFFF; padding: 28px; border-radius: 12px;
            width: 400px; min-height: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Pretendard, sans-serif; color: #1A1918;
            display: flex; flex-direction: column;
        }
        @media (max-width: 768px) {
            .downloader-panel { width: 90%; }
            .css-1aem01m.eh9908w0 {
                overflow-y: auto;
            }
        }
        .downloader-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .downloader-title { margin: 0; font-size: 22px; font-weight: bold; }
        .downloader-close-btn { background: none; border: none; cursor: pointer; padding: 0; font-size: 28px; color: #333; line-height: 1; }
        .downloader-content { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .downloader-panel label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #666; }
        .downloader-panel input[type="number"] {
            width: 100%; padding: 14px; border: none; border-radius: 8px;
            font-size: 16px; box-sizing: border-box; background-color: #F0F0F0; margin-bottom: 16px;
        }
        .format-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
        .format-btn {
            flex: 1; padding: 14px; border-radius: 8px; border: 1px solid #FF4432;
            font-size: 16px; font-weight: bold; cursor: pointer;
            background-color: #FF4432; color: white;
        }
        .checkbox-group { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .checkbox-group label { margin: 0; font-size: 14px; color: #333; }
        .status-text { margin-top: auto; padding-top: 15px; text-align: center; min-height: 20px; color: #85837D; font-size: 13px; }
    `);

    class ApiHandler {
        constructor() { this.apiUrl = 'https://contents-api.wrtn.ai'; }
        extractCookie(key) { const match = document.cookie.match(new RegExp(`(?:^|; )${key.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)); return match ? decodeURIComponent(match[1]) : null; }
        getChatInfo() { const match = location.pathname.match(/\/u\/([a-f0-9]+)\/c\/([a-f0-9]+)/); return match ? { characterId: match[1], chatroomId: match[2] } : null; }
        async fetchAllMessages(chatroomId, maxTurnsToSave, updateStatus) {
            const accessToken = this.extractCookie('access_token');
            if (!accessToken) throw new Error('로그인이 필요합니다.');
            const messagesToFetch = maxTurnsToSave * 2;
            updateStatus(`전체 대화 기록을 불러오는 중...`);
            const url = `${this.apiUrl}/character-chat/api/v2/chat-room/${chatroomId}/messages?limit=${messagesToFetch}`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error(`서버 통신 오류: ${response.status}`);
            const data = await response.json();
            return (data.data.list || []);
        }
    }
    const apiHandler = new ApiHandler();

    function generateTxtContent(messages) {
        return messages.map(msg => `[${msg.role} message]\n${msg.content}`).join('\n\n===\n\n');
    }

    function generateJsonContent(messages) {
        const filteredMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        return JSON.stringify(filteredMessages, null, 2);
    }

    const renderer = new marked.Renderer();
    renderer.heading = (text, level) => { if (level === 1) return `<h1 class="css-fkmgr6">${text}</h1>`; if (level === 2) return `<h2 class="css-2q86u5">${text}</h2>`; if (level === 3) return `<h3 class="css-rd1auw">${text}</h3>`; return `<h${level}>${text}</h${level}>`; };
    renderer.strong = (text) => `<strong class="css-sd7959">${text}</strong>`;
    renderer.em = (text) => `<em class="css-1qbs0mm">${text}</em>`;
    renderer.list = (body, ordered, start) => { const tag = ordered ? 'ol' : 'ul'; const startAttr = (ordered && start > 1) ? ` start="${start}"` : ''; const className = ordered ? 'css-yggfb7' : 'css-1ostlo9'; return `<${tag} class="${className}"${startAttr}>${body}</${tag}>`; };
    renderer.listitem = (text) => `<li class="css-kvpj24">${text}</li>`;
    renderer.blockquote = (quote) => `<blockquote class="css-sfgh1n">${quote}</blockquote>`;
    renderer.hr = () => '<hr>';
    renderer.image = (href, title, text) => `<div class="css-obwzop"><img src="${href}" alt="${text}" class="css-1xeqs9p"></div>`;
    renderer.code = (code, lang) => `<pre class="code-block"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    delete renderer.paragraph;
    marked.setOptions({ renderer, gfm: true, breaks: true });

    function generateHtmlContent(messages, characterName) {
        const messageHtml = messages.map(msg => {
            let contentHtml = marked.parse(msg.content || '');
            const paragraphClass = msg.role === 'user' ? 'css-192kozn' : 'css-1dfojlr';
            contentHtml = contentHtml.replace(/<p>/g, `<div class="${paragraphClass}">`).replace(/<\/p>/g, '</div>');
            const roleClass = msg.role === 'user' ? 'user' : 'assistant';
            const deleteButtonHtml = `
                <div class="message-actions">
                    <button class="action-btn delete-btn" title="메시지 삭제">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" width="20" height="20">
                            <path d="M15.44 4.337H8.56v-1.6h6.88zm-6 12v-5.6h1.6v5.6zm3.53-5.6v5.6h1.6v-5.6z"></path>
                            <path fill-rule="evenodd" d="M2.6 5.427v1.6h1.57v13.91c0 .772.628 1.4 1.4 1.4h12.86c.772 0 1.4-.628 1.4-1.4V7.027h1.57v-1.6zm15.63 1.6H5.77v13.71h12.46z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>`;
            return `
                <div class="message-wrapper ${roleClass}">
                    ${msg.role === 'assistant' ? `<div class="character-name-wrapper"><div class="character-name">${characterName}</div></div>` : ''}
                    <div class="message-bubble ${roleClass}-bubble">
                        ${contentHtml}
                        ${deleteButtonHtml}
                    </div>
                </div>`;
        }).join('');

        const fullHtmlStyle = `
            :root {
                --surface_chat_secondary: #61605A; --text_white: #FFFFFF; --text_primary: #1A1918;
                --text_secondary: #61605A; --text_tertiary: #85837D; --text_disabled: #C7C5BD;
                --icon_tertiary: #85837D; --icon_white: #FFFFFF;
            }
            body { font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif; background-color: #FFFFFF; margin: 0; }
            .chat-container {
                max-width: 800px; margin: 0 auto;
                padding: 20px; display: flex; flex-direction: column;
            }
            .message-wrapper { display: flex; flex-direction: column; margin-bottom: 15px; }
            .message-wrapper.user { align-items: flex-end; }
            .message-wrapper.assistant { align-items: flex-start; }
            .character-name-wrapper { display: flex; }
            .character-name { font-size: 14px; color: var(--text_secondary); margin-bottom: 5px; padding-left: 10px; }
            .message-bubble { position: relative; line-height: 1.6; word-wrap: break-word; box-sizing: border-box; }
            .user-bubble {
                padding: 12px 20px 36px 20px; border-radius: 10px 10px 0px 10px;
                background-color: var(--surface_chat_secondary); color: var(--text_white);
                max-width: 640px;
            }
            .assistant-bubble {
                padding: 16px 20px 36px 20px; border-radius: 0px 10px 10px 10px;
                background-color: #F0EFEB; color: var(--text_primary);
                max-width: 740px;
            }
            @media (max-width: 840px) {
                .chat-container { padding: 10px; }
                .user-bubble, .assistant-bubble { max-width: 95%; }
                .message-bubble { font-size: 16px; }
            }
            .css-1dfojlr, .css-192kozn { margin-bottom: 1em; } .css-1dfojlr:last-child, .css-192kozn:last-child { margin-bottom: 0; }
            .message-bubble h1, .message-bubble h2, .message-bubble h3 { color: var(--text_primary); font-weight: 700; }
            .user-bubble h1, .user-bubble h2, .user-bubble h3 { color: var(--text_white); }
            .message-bubble ul, .message-bubble ol { padding: 4px 0 4px 20px; line-height: 180%; font-weight: 500; list-style-position: outside; }
            .user-bubble ul, .user-bubble ol { color: var(--text_white); } .assistant-bubble ul, .assistant-bubble ol { color: var(--text_primary); }
            .message-bubble strong { font-weight: 700; } .user-bubble strong { color: var(--text_white); } .assistant-bubble strong { color: var(--text_primary); }
            .message-bubble em { font-style: normal; } .assistant-bubble em { color: var(--text_tertiary); } .user-bubble em { color: var(--text_disabled); }
            .message-bubble blockquote { margin: 10px 0; padding: 10px 15px; border-left: 4px solid #ccc; background-color: #f9f9f9; color: #666; }
            .message-bubble img { max-width: 100%; border-radius: 5px; }
            .message-bubble pre.code-block { background-color: #2d2d2d; color: #f2f2f2; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: "IBMPlexMono-Regular", monospace; }
            .message-bubble hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
            .scroll-buttons { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; opacity: 1; transition: opacity 0.3s; }
            .scroll-btn {
                width: 40px; height: 40px; border-radius: 50%;
                background-color: #61605A; color: #FFFFFF;
                border: none; cursor: pointer; font-size: 24px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .scroll-btn:hover { opacity: 0.8; }
            @media (max-width: 768px) {
                .scroll-buttons { opacity: 0; }
                .scroll-btn { width: 50px; height: 50px; font-size: 28px; }
            }
            .message-actions { position: absolute; bottom: 8px; right: 8px; opacity: 1; }
            .action-btn { display: flex; justify-content: center; align-items: center; background-color: transparent; border: none; border-radius: 3px; cursor: pointer; padding: 2px; }
            .action-btn svg { fill: var(--icon_white); }
            .user-bubble .action-btn svg { fill: var(--icon_white); }
            .assistant-bubble .action-btn svg { fill: var(--icon_tertiary); }
            .delete-confirm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1001; }
            .delete-confirm-panel { display: flex; flex-direction: column; padding: 32px 24px 20px; width: 320px; background-color: #fff; border-radius: 10px; gap: 24px; align-items: center; text-align: center; }
            .delete-confirm-panel .title { color: #1a1918; font-size: 18px; font-weight: bold; margin: 0; }
            .delete-confirm-panel .subtitle { color: #61605a; font-size: 14px; margin: 0; }
            .delete-confirm-buttons { display: flex; width: 100%; gap: 8px; }
            .delete-confirm-buttons button { flex: 1; padding: 0 20px; height: 40px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; border: none; }
            .delete-confirm-cancel { background-color: #f0efeb; color: #1a1918; }
            .delete-confirm-delete { background-color: #0d0d0c; color: #fcfcfa; }
            .save-changes-container { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; display: none; }
            .save-changes-btn {
                padding: 12px 24px; border-radius: 100px; border: none;
                background-color: #FF4432; color: white; font-size: 16px; font-weight: bold;
                cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        `;

        const embeddedScript = `
            document.addEventListener('DOMContentLoaded', () => {
                const scrollTopBtn = document.getElementById('scroll-top-btn');
                const scrollBottomBtn = document.getElementById('scroll-bottom-btn');
                if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
                if (scrollBottomBtn) scrollBottomBtn.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

                const saveChangesBtn = document.getElementById('save-changes-btn');
                document.body.addEventListener('click', (e) => {
                    const deleteBtn = e.target.closest('.delete-btn');
                    if (deleteBtn) {
                        const messageWrapper = deleteBtn.closest('.message-wrapper');
                        showDeleteConfirm(messageWrapper);
                    }
                });

                if (saveChangesBtn) {
                    saveChangesBtn.addEventListener('click', () => {
                        const safeCharacterName = document.title.replace(' Chat Log', '').replace(/[\\\\/:*?"<>|]/g, '').trim();
                        const fileName = \`\${safeCharacterName}.html\`;
                        document.querySelector('.save-changes-container').style.display = 'none';
                        const currentHtml = document.documentElement.outerHTML;
                        downloadFile(currentHtml, fileName, 'text/html;charset=utf-8');
                    });
                }
                if (window.matchMedia("(max-width: 768px)").matches) {
                    const scrollButtons = document.querySelector('.scroll-buttons');
                    let scrollTimeout;
                    window.addEventListener('scroll', () => {
                        clearTimeout(scrollTimeout);
                        scrollButtons.style.opacity = '1';
                        scrollTimeout = setTimeout(() => {
                            scrollButtons.style.opacity = '0';
                        }, 1500);
                    });
                }
            });

            function showDeleteConfirm(messageWrapper) {
                if (document.querySelector('.delete-confirm-overlay')) return;
                const overlay = document.createElement('div');
                overlay.className = 'delete-confirm-overlay';
                overlay.innerHTML = \`
                    <div class="delete-confirm-panel">
                        <div><p class="title">해당 메시지를 삭제하시겠습니까?</p><div class="subtitle">메시지 삭제 후 변경 사항을 저장하세요</div></div>
                        <div class="delete-confirm-buttons"><button class="delete-confirm-cancel">취소</button><button class="delete-confirm-delete">삭제</button></div>
                    </div>\`;
                document.body.appendChild(overlay);

                const closePopup = () => overlay.remove();
                overlay.querySelector('.delete-confirm-cancel').addEventListener('click', closePopup);
                overlay.querySelector('.delete-confirm-delete').addEventListener('click', () => {
                    if (messageWrapper) {
                        messageWrapper.remove();
                        const saveChangesContainer = document.querySelector('.save-changes-container');
                        if (saveChangesContainer) saveChangesContainer.style.display = 'block';
                    }
                    closePopup();
                });
                overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
            }

            function downloadFile(content, fileName, mimeType) {
                const a = document.createElement('a');
                const blob = new Blob([content], { type: mimeType });
                a.href = URL.createObjectURL(blob);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }
        `;

        return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${characterName} Chat Log</title><style>${fullHtmlStyle}</style></head>
<body>
    <div class="chat-container">${messageHtml}</div>
    <div class="scroll-buttons">
        <button id="scroll-top-btn" class="scroll-btn" title="맨 위로">${ICONS.arrowUp}</button>
        <button id="scroll-bottom-btn" class="scroll-btn" title="맨 아래로">${ICONS.arrowDown}</button>
    </div>
    <div class="save-changes-container">
        <button id="save-changes-btn" class="save-changes-btn">변경 사항 저장</button>
    </div>
    <script>${embeddedScript}<` + `/script>
</body></html>`;
    }

    function downloadFile(content, fileName, mimeType) {
        const a = document.createElement('a');
        const blob = new Blob([content], { type: mimeType });
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    async function copyToClipboard(text, statusEl, downloadSuccessMessage) {
        try {
            await navigator.clipboard.writeText(text);
            statusEl.textContent = `${downloadSuccessMessage} 클립보드에 복사되었습니다.`;
        } catch (err) {
            statusEl.textContent = '클립보드 복사에 실패했습니다.';
            console.error('Clipboard copy failed:', err);
        }
    }

    async function startDownloadProcess(format) {
        const statusText = document.getElementById('downloader-status-text');
        const turnCount = parseInt(document.getElementById('message-count-input').value, 10);
        const shouldCopyToClipboard = document.getElementById('copy-clipboard-checkbox').checked;

        if (isNaN(turnCount) || turnCount <= 0 || turnCount > 1000) {
            alert('저장할 턴 수는 1에서 1000 사이의 숫자여야 합니다.'); return;
        }

        try {
            statusText.textContent = '채팅방 정보를 확인하는 중...';
            const chatInfo = apiHandler.getChatInfo();
            if (!chatInfo) throw new Error('채팅방 정보를 찾을 수 없습니다.');

            const allFetchedMessages = await apiHandler.fetchAllMessages(chatInfo.chatroomId, 1000, (status) => { statusText.textContent = status; });
            if (!allFetchedMessages.length) throw new Error('불러올 대화 기록이 없습니다.');

            const chronologicalMessages = [...allFetchedMessages].reverse();
            const messagesToSave = chronologicalMessages.slice(0, turnCount * 2);

            const characterNameElement = document.querySelector('.css-1d974c8, .css-1g4onpx');
            const characterName = characterNameElement?.textContent || '캐릭터';
            const safeCharacterName = characterName.replace(/[\\/:*?"<>|]/g, '').trim();
            const fileName = `${safeCharacterName}.${format}`;

            statusText.textContent = '파일을 생성하는 중...';

            if (format === 'html') {
                downloadFile(generateHtmlContent(messagesToSave, characterName), fileName, 'text/html;charset=utf-8');
            } else if (format === 'txt') {
                downloadFile(generateTxtContent(messagesToSave), fileName, 'text/plain;charset=utf-8');
            } else if (format === 'json') {
                downloadFile(generateJsonContent(messagesToSave), fileName, 'application/json;charset=utf-8');
            }

            const downloadSuccessMessage = `다운로드 성공! 총 ${messagesToSave.length / 2}턴(${messagesToSave.length}개) 메시지 저장.`;

            if (shouldCopyToClipboard) {
                await copyToClipboard(generateTxtContent(messagesToSave), statusText, downloadSuccessMessage);
            } else {
                statusText.textContent = downloadSuccessMessage;
            }

        } catch (error) {
            console.error('다운로드 실패:', error);
            statusText.textContent = `오류: ${error.message}`;
        }
    }

    function showPopupPanel() {
        if (document.querySelector('.downloader-panel-overlay')) return;
        const panelOverlay = document.createElement('div');
        panelOverlay.className = 'downloader-panel-overlay';
        panelOverlay.innerHTML = `
            <div class="downloader-panel">
                <div class="downloader-header">
                    <h2 class="downloader-title">대화 저장 설정</h2>
                    <button id="downloader-close-btn" class="downloader-close-btn">${ICONS.close}</button>
                </div>
                <div class="downloader-content">
                    <div>
                        <div class="input-group">
                            <label for="message-count-input">저장할 턴 수 (최대 1000)</label>
                            <input type="number" id="message-count-input" value="30" min="1" max="1000">
                        </div>
                        <div class="format-buttons">
                            <button id="save-html-btn" class="format-btn">HTML</button>
                            <button id="save-txt-btn" class="format-btn">TXT</button>
                            <button id="save-json-btn" class="format-btn">JSON</button>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="copy-clipboard-checkbox">
                            <label for="copy-clipboard-checkbox">클립보드에 복사하기</label>
                        </div>
                    </div>
                    <p id="downloader-status-text" class="status-text"></p>
                </div>
            </div>`;
        document.body.appendChild(panelOverlay);

        document.getElementById('downloader-close-btn').addEventListener('click', closePopupPanel);
        document.getElementById('save-html-btn').addEventListener('click', () => startDownloadProcess('html'));
        document.getElementById('save-txt-btn').addEventListener('click', () => startDownloadProcess('txt'));
        document.getElementById('save-json-btn').addEventListener('click', () => startDownloadProcess('json'));
    }

    function closePopupPanel() {
        const panel = document.querySelector('.downloader-panel-overlay');
        if (panel) panel.remove();
    }

    function injectButton() {
        if (document.querySelector('.chat-log-downloader-btn-desktop') || document.querySelector('.chat-log-downloader-btn-mobile')) return;

        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        if (isMobile) {
            const mobileTargetContainer = document.querySelector('.css-1aem01m.eh9908w0');
            if (mobileTargetContainer) {
                const saveButton = document.createElement('button');
                saveButton.className = 'chat-log-downloader-btn-mobile';
                saveButton.innerHTML = `<span class="icon-box">${ICONS.chat}</span><span>대화 내용 저장</span>`;
                saveButton.addEventListener('click', showPopupPanel);
                mobileTargetContainer.appendChild(saveButton);
                return true;
            }
        } else {
            const desktopTarget = document.querySelector('.css-2j5iyq.eh9908w0');
            if (desktopTarget && desktopTarget.parentElement?.parentElement) {
                const rightButtonsGroup = desktopTarget.parentElement;
                const topBarContainer = rightButtonsGroup.parentElement;
                const saveButton = document.createElement('button');
                saveButton.className = 'chat-log-downloader-btn-desktop';
                saveButton.innerHTML = `<span class="icon-box">${ICONS.chat}</span><span>대화 내용 저장</span>`;
                saveButton.addEventListener('click', showPopupPanel);
                topBarContainer.insertBefore(saveButton, rightButtonsGroup);
                return true;
            }
        }
        return false;
    }

    const injectionInterval = setInterval(() => {
        if (injectButton()) {
            clearInterval(injectionInterval);
        }
    }, 500);

})();