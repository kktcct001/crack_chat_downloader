// ==UserScript==
// @name         [테스트 코드] Crack Chat Downloader (크랙 채팅 다운로더)
// @namespace    https://github.com/kktcct001/crack_chat_downloader
// @version      3.3.3
// @description  크랙 캐릭터 채팅의 대화를 개별 또는 전체 HTML, TXT, JSON 파일로 저장하고 클립보드에 복사
// @author       kktcct001
// @match        https://crack.wrtn.ai/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// @downloadURL  https://github.com/kktcct001/crack_chat_downloader/raw/main/Crack_Chat_Downloader.user.js
// @updateURL    https://github.com/kktcct001/crack_chat_downloader/raw/main/Crack_Chat_Downloader.user.js
// ==/UserScript==

// ==================================================================================
// [감사의 말]
// 전체 채팅 저장 기능은 "케츠"님이 제작하신 "뤼튼 크랙 채팅 백업" 스크립트에서
// 영감을 받아 제작되었습니다. 기존 DOM 스크래핑 방식에서
// API 호출 방식으로 로직을 재구성하였으나
// 훌륭한 아이디어를 제공해 주신 원작자분께 깊은 감사의 말씀을 드립니다.
// ==================================================================================

(function() {
    'use strict';

    const CONFIG = {
        storageKey: 'crackChatDownloader_lastTurnCount',
        saveOrderKey: 'crackChatDownloader_lastSaveOrder',
        fullSaveDelay: 1000
    };

    const SELECTORS = {
        characterName: '.css-1d974c8, .css-1g4onpx',
        buttons: { desktopInjectTarget: '.css-2j5iyq.eh9908w0' },
        panel: { overlay: '.downloader-panel-overlay', closeBtn: '#downloader-close-btn', statusText: '#downloader-status-text' },
    };

    const ICONS = {
        chat: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/><path d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8m0 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>`,
        arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 12a.5.5 0 0 1-.5-.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5a.5.5 0 0 1-.5-.5z"/></svg>`,
        arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/></svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="#FFFFFF" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" width="1em" height="1em" fill="currentColor"><path d="M15.44 4.337H8.56v-1.6h6.88zm-6 12v-5.6h1.6v5.6zm3.53-5.6v5.6h1.6v-5.6z"></path><path fill-rule="evenodd" d="M2.6 5.427v1.6h1.57v13.91c0 .772.628 1.4 1.4 1.4h12.86c.772 0 1.4-.628 1.4-1.4V7.027h1.57v-1.6zm15.63 1.6H5.77v13.71h12.46z" clip-rule="evenodd"></path></svg>`,
        unchecked: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/></svg>`,
        checked: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>`,
        panelToggle: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path id="toggle_bar" fill-rule="evenodd" clip-rule="evenodd" d="M4.16667 2.5H2.5V17.5H4.16667V2.5Z" fill="#85837D"></path><path id="toggle_open_arrow" d="M8.54643 12.9461L9.72494 14.1246L12.6712 11.1783L12.9658 10.8837C13.454 10.3955 13.454 9.60406 12.9658 9.11591L12.6712 8.82128L9.72494 5.875L8.54643 7.05351L10.6594 9.16646H2.5V10.8331H10.6594L8.54643 12.9461Z" fill="#85837D"></path><path id="toggle_close_arrow" d="M11.4535 7.05351L10.275 5.875L7.32871 8.82128L7.03409 9.11591C6.54593 9.60406 6.54593 10.3955 7.03409 10.8837L7.32871 11.1783L10.275 14.1246L11.4535 12.9461L9.34056 10.8331L17.4999 10.8331V9.16645L9.34056 9.16646L11.4535 7.05351Z" fill="#85837D"></path></svg>`
    };

    const apiHandler = {
        apiBaseUrl: 'https://contents-api.wrtn.ai/character-chat/api/v2',
        extractCookie(key) { const match = document.cookie.match(new RegExp(`(?:^|; )${key.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)); return match ? decodeURIComponent(match[1]) : null; },
        getChatInfo() { const match = location.pathname.match(/\/u\/([a-f0-9]+)\/c\/([a-f0-9]+)/); return match ? { characterId: match[1], chatroomId: match[2] } : null; },
        async fetchAllChatrooms(accessToken, onPageLoad) {
            let allRooms = []; let nextCursor = null; let pageCount = 1; let hasMore = true; const headers = { 'Authorization': `Bearer ${accessToken}` };
            while (hasMore) {
                if (onPageLoad) onPageLoad(pageCount, allRooms.length);
                const url = nextCursor ? `${this.apiBaseUrl}/chat?type=character&limit=40&cursor=${nextCursor}` : `${this.apiBaseUrl}/chat?type=character&limit=40`;
                const response = await fetch(url, { headers }); if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
                const responseData = await response.json(); if (!responseData?.data?.chats) throw new Error('API 응답에서 채팅 목록(data.chats)을 찾을 수 없습니다.');
                const { chats, nextCursor: newCursor } = responseData.data;
                if (chats.length > 0) allRooms.push(...chats);
                if (newCursor) { nextCursor = newCursor; pageCount++; } else { hasMore = false; }
            } return allRooms;
        },
        async fetchAllMessages(chatroomId, accessToken) {
            const url = `${this.apiBaseUrl}/chat-room/${chatroomId}/messages?limit=2000`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } }); if (!response.ok) throw new Error(`'${chatroomId}' 메시지 로드 실패: ${response.status}`);
            const data = await response.json(); return (data.data.list || []).reverse();
        }
    };

    const contentGenerator = {
        generateTxt(messages) { return messages.map(msg => `[${msg.role === 'user' ? '사용자' : '캐릭터'} message]\n${msg.content}`).join('\n\n===\n\n'); },
        generateJson(messages) { const filtered = messages.map(msg => ({ role: msg.role, content: msg.content })); return JSON.stringify(filtered, null, 2); },
        generateHtml(messages, characterName) {
            const renderer = new marked.Renderer(); renderer.heading = (text, level) => `<h${level}>${text}</h${level}>`; renderer.strong = (text) => `<strong>${text}</strong>`; renderer.em = (text) => `<em>${text}</em>`; renderer.list = (body, ordered) => `<${ordered ? 'ol' : 'ul'}>${body}</${ordered ? 'ol' : 'ul'}>`; renderer.listitem = (text) => `<li>${text}</li>`; renderer.blockquote = (quote) => `<blockquote>${quote}</blockquote>`; renderer.hr = () => '<hr>'; renderer.image = (href, title, text) => `<div><img src="${href}" alt="${text}"></div>`; renderer.code = (code) => `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`; delete renderer.paragraph; marked.setOptions({ renderer, gfm: true, breaks: true });
            const messageHtml = messages.map(msg => {
                let contentHtml = marked.parse(msg.content || '');
                contentHtml = contentHtml.replace(/<p>/g, `<div>`).replace(/<\/p>/g, '</div>');
                const roleClass = msg.role === 'user' ? 'user' : 'assistant';
                const actionButtonHtml = `<div class="message-actions"><button class="action-btn delete-btn" title="메시지 삭제">${ICONS.trash}</button><div class="message-checkbox" title="메시지 선택"><span class="checkbox-icon unchecked">${ICONS.unchecked}</span><span class="checkbox-icon checked">${ICONS.checked}</span></div></div>`;
                return `<div class="message-wrapper ${roleClass}">${msg.role === 'assistant' ? `<div class="character-name-wrapper"><div class="character-name">${characterName}</div></div>` : ''}<div class="message-bubble ${roleClass}-bubble">${contentHtml}${actionButtonHtml}</div></div>`;
            }).join('');
            const fullHtmlStyle = `:root{--surface_chat_secondary:#61605A;--text_white:#fff;--text_primary:#1A1918;--text_secondary:#61605A;--text_tertiary:#85837D;--text_disabled:#C7C5BD;--icon_tertiary:#85837D;--icon_white:#fff}body{font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;background-color:#fff;margin:0;padding-bottom:80px}body.edit-mode{padding-bottom:60px}.chat-container{max-width:800px;margin:0 auto;padding:20px;display:flex;flex-direction:column}.message-wrapper{display:flex;flex-direction:column;margin-bottom:15px}.message-wrapper.user{align-items:flex-end}.message-wrapper.assistant{align-items:flex-start}.character-name-wrapper{display:flex}.character-name{font-size:14px;color:var(--text_secondary);margin-bottom:5px;padding-left:10px}.message-bubble{position:relative;line-height:1.6;word-wrap:break-word;box-sizing:border-box}.user-bubble{padding:12px 20px 36px;border-radius:10px 10px 0 10px;background-color:var(--surface_chat_secondary);color:var(--text_white);max-width:640px}.assistant-bubble{padding:16px 20px 36px;border-radius:0 10px 10px;background-color:#F0EFEB;color:var(--text_primary);max-width:740px}body.edit-mode .message-bubble{cursor:pointer}div,p{margin-bottom:1em}div:last-child,p:last-child{margin-bottom:0}.message-bubble h1,.message-bubble h2,.message-bubble h3{color:var(--text_primary);font-weight:700}.user-bubble h1,.user-bubble h2,.user-bubble h3{color:var(--text_white)}.message-bubble ul,.message-bubble ol{padding:4px 0 4px 20px;line-height:180%;font-weight:500;list-style-position:outside}.user-bubble ul,.user-bubble ol{color:var(--text_white)}.assistant-bubble ul,.assistant-bubble ol{color:var(--text_primary)}.message-bubble strong{font-weight:700}.user-bubble strong{color:var(--text_white)}.assistant-bubble strong{color:var(--text_primary)}.message-bubble em{font-style:normal}.assistant-bubble em{color:var(--text_tertiary)}.user-bubble em{color:var(--text_disabled)}.message-bubble blockquote{margin:10px 0;padding:10px 15px;border-left:4px solid #ccc;background-color:#f9f9f9;color:#666}.message-bubble img{max-width:100%;border-radius:5px}.message-bubble pre{background-color:#2d2d2d;color:#f2f2f2;padding:15px;border-radius:5px;white-space:pre-wrap;font-family:monospace}.message-bubble hr{border:none;border-top:1px solid #ddd;margin:1.5em 0}.floating-buttons{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:1002;transition:opacity .3s,bottom .3s,visibility .3s,pointer-events 0s .3s}body.edit-mode .floating-buttons{bottom:80px}.floating-btn{width:40px;height:40px;border-radius:50%;background-color:#333333;color:#fff;border:none;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,.2)}.floating-btn:hover{opacity:.8}.floating-btn svg{width:20px;height:20px}.message-actions{position:absolute;bottom:8px;right:8px;width:24px;height:24px;display:flex;justify-content:center;align-items:center}.action-btn,.message-checkbox{position:absolute;top:0;left:0;width:100%;height:100%;display:none;justify-content:center;align-items:center;background-color:transparent;border:none;padding:0;cursor:pointer;box-sizing:border-box}.action-btn svg{width:20px;height:20px}.message-checkbox svg{width:16px;height:16px}.user-bubble .action-btn svg,.user-bubble .message-checkbox svg{fill:var(--icon_white)}.assistant-bubble .action-btn svg,.assistant-bubble .message-checkbox svg{fill:var(--icon_tertiary)}body:not(.edit-mode) .delete-btn{display:flex}body.edit-mode .message-checkbox{display:flex}.checkbox-icon.checked{display:none}.message-wrapper.selected .checkbox-icon.checked{display:block}.message-wrapper.selected .checkbox-icon.unchecked{display:none}.delete-confirm-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:1003}.delete-confirm-panel{display:flex;flex-direction:column;padding:32px 24px 20px;width:320px;background-color:#fff;border-radius:10px;text-align:center}.delete-confirm-panel .text-group{flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px;padding-bottom:16px}.delete-confirm-panel .title{color:#1a1918;font-size:18px;font-weight:700;margin:0}.delete-confirm-panel .subtitle{color:#61605a;font-size:14px;margin:0}.delete-confirm-buttons{display:flex;width:100%;gap:8px}.delete-confirm-buttons button{flex:1;padding:0 20px;height:40px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;border:none}.delete-confirm-cancel{background-color:#f0efeb;color:#1a1918}.delete-confirm-delete{background-color:#0d0d0c;color:#fcfcfa}.save-changes-container{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;display:none}.save-changes-btn{padding:12px 24px;border-radius:100px;border:none;background-color:#FF4432;color:#fff;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)}#edit-action-bar{position:fixed;bottom:0!important;left:0;width:100%;background-color:#333;color:#fff;display:none;align-items:center;padding:12px 20px!important;margin:0!important;box-sizing:border-box;z-index:1001}body.edit-mode #edit-action-bar{display:flex}#selection-count{font-size:16px;font-weight:600;flex-grow:1;text-align:center;margin-left:auto}.action-bar-buttons{display:flex;gap:8px;align-items:center;margin-left:auto}.action-bar-btn{background:0 0;border:none;color:#fff;cursor:pointer;padding:8px;display:flex;align-items:center;justify-content:center}.action-bar-btn svg{width:24px;height:24px}#bulk-delete-btn{opacity:1;transition:opacity .2s}#bulk-delete-btn:disabled{opacity:.5;cursor:not-allowed}@media (min-width:769px){#bulk-delete-btn svg,#exit-edit-mode-btn svg{width:28px;height:28px}}@media (max-width:768px){body{padding-bottom:80px}body.edit-mode{padding-bottom:60px}body.edit-mode .floating-buttons{opacity:0;visibility:hidden;pointer-events:none;transition:none}.floating-buttons.init-hide{opacity:0;visibility:hidden;pointer-events:none}.floating-buttons.visible{opacity:1;visibility:visible;pointer-events:auto}.floating-btn{width:50px;height:50px;font-size:28px}.floating-btn svg{width:24px;height:24px}}@media (max-width:840px){body{font-size:13px}.chat-container{padding:10px 5px}.user-bubble,.assistant-bubble{max-width:100%;border-radius:8px}.message-bubble{font-size:1em}.message-bubble h1{font-size:1.5em}.message-bubble h2{font-size:1.3em}.message-bubble h3{font-size:1.15em}.message-wrapper.user,.message-wrapper.assistant{align-items:stretch}}`;
            const embeddedScript = `const ICONS = { close: \`${ICONS.close}\`, edit: \`${ICONS.edit}\` }; function d장하는 중...');
                const fullHtmlContent = contentGenerator.generateFullHtml(allChatsData);
                const timestamp = new Date().toISOString().slice(0, 10);
                utils.downloadFile(fullHtmlContent, `wrtn_full_backup_${timestamp}.html`, 'text/html;charset=utf-8');
                utils.updateStatus(statusEl, `전체 백업 성공! 총 ${chatrooms.length}개의 채팅방을 저장했습니다.`);
            } catch (error) { console.error('전체 다운로드 실패:', error); utils.updateStatus(statusEl, `오류: ${error.message}`, true); }
        }
    };

    app.init();

})();
