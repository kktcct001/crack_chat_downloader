// ==UserScript==
// @name         Crack Chat Downloader (크랙 채팅 다운로더)
// @namespace    https://github.com/kktcct001/crack_chat_downloader
// @version      2.3.8
// @description  크랙 캐릭터 채팅의 대화를 HTML, TXT, JSON 파일로 저장하고 클립보드에 복사
// @author       kktcct001
// @match        https://crack.wrtn.ai/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// @require      https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js
// @downloadURL  https://github.com/kktcct001/crack_chat_downloader/raw/refs/heads/main/Crack_Chat_Downloader.user.js
// @updateURL    https://github.com/kktcct001/crack_chat_downloader/raw/refs/heads/main/Crack_Chat_Downloader.user.js
// ==/UserScript==

// ==============================================================================
// [감사의 글]
// CCD의 전체 채팅 저장은 케츠 님의 "뤼튼 크랙 채팅 백업" 스크립트에서
// 영감을 받아, 기존 DOM 스크래핑 방식을 API 호출 방식으로 변경하였습니다.
// 훌륭한 아이디어를 제공해 주신 케츠 님께 깊은 감사의 말씀을 드립니다.
// ==============================================================================

(function() {
    'use strict';

    const CONFIG = {
        storageKey: 'crackChatDownloader_lastTurnCount',
        saveOrderKey: 'crackChatDownloader_lastSaveOrder',
        fullSaveDelay: 1000,
        assistantBubbleColor: '#E9EFF5'
    };

    const SELECTORS = {
        characterName: '.css-1d974c8, .css-1g4onpx',
        buttons: {
            desktopInjectTarget: '.css-2j5iyq.eh9908w0'
        },
        panel: {
            overlay: '.downloader-panel-overlay',
            closeBtn: '#downloader-close-btn',
            statusText: '.status-text'
        },
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
        panelToggle: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><g><path id="toggle_bar" d="M4.16667 2.5H2.5V17.5H4.16667V2.5Z" fill="#85837D"></path><path id="toggle_open_arrow" d="M8.54643 12.9461L9.72494 14.1246L12.6712 11.1783L12.9658 10.8837C13.454 10.3955 13.454 9.60406 12.9658 9.11591L12.6712 8.82128L9.72494 5.875L8.54643 7.05351L10.6594 9.16646H2.5V10.8331H10.6594L8.54643 12.9461Z" fill="#85837D"></path><path id="toggle_close_arrow" d="M11.4535 7.05351L10.275 5.875L7.32871 8.82128L7.03409 9.11591C6.54593 9.60406 6.54593 10.3955 7.03409 10.8837L7.32871 11.1783L10.275 14.1246L11.4535 12.9461L9.34056 10.8331L17.4999 10.8331V9.16645L9.34056 9.16646L11.4535 7.05351Z" fill="#85837D"></path></g></svg>`,
        spinner: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 9.64322 20.3548 7.50294 18.8957 5.87158" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
        success: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L6.31 9.24l-2.13-2.13a.75.75 0 0 0-1.06 1.06L5.75 10.8l.022.022a.75.75 0 0 0 1.06 0l5.25-6.5a.75.75 0 0 0-.022-1.08"/></svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/></svg>`,
        search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" stroke-width="0.5" stroke="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg>`,
        journal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" stroke="currentColor" stroke-width="0.5"><path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/><path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/></svg>`,
    };

    const apiHandler = {
        apiBaseUrl: 'https://contents-api.wrtn.ai/character-chat/api/v2',
        extractCookie(key) {
            const match = document.cookie.match(new RegExp(`(?:^|; )${key.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
            return match ? decodeURIComponent(match[1]) : null;
        },
        getChatInfo() {
            const match = location.pathname.match(/\/u\/([a-f0-9]+)\/c\/([a-f0-9]+)/);
            return match ? {
                characterId: match[1],
                chatroomId: match[2]
            } : null;
        },
        async fetchAllChatrooms(accessToken, onPageLoad) {
            let allRooms = [];
            let nextCursor = null;
            let pageCount = 1;
            let hasMore = true;
            const headers = {
                'Authorization': `Bearer ${accessToken}`
            };
            while (hasMore) {
                if (onPageLoad) onPageLoad(pageCount, allRooms.length);
                const url = nextCursor ? `${this.apiBaseUrl}/chat?type=character&limit=40&cursor=${nextCursor}` : `${this.apiBaseUrl}/chat?type=character&limit=40`;
                const response = await fetch(url, {
                    headers
                });
                if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
                const responseData = await response.json();
                if (!responseData?.data?.chats) throw new Error('API 응답에서 채팅 목록(data.chats)을 찾을 수 없습니다.');
                const {
                    chats,
                    nextCursor: newCursor
                } = responseData.data;
                if (chats.length > 0) allRooms.push(...chats);
                if (newCursor) {
                    nextCursor = newCursor;
                    pageCount++;
                } else {
                    hasMore = false;
                }
            }
            return allRooms;
        },
        async fetchAllMessages(chatroomId, accessToken) {
            // [턴 상한 수정 가이드 1/3]
            // 아래의 'limit=2000'은 한 번에 불러올 메시지의 최대 개수 (2000개 = 1000턴)
            // 만약 턴 수 상한을 2000턴으로 올리고 싶다면, 값을 'limit=4000'으로 변경
            // [!주의!] 4000개(2000턴) 정도 권장, 값을 너무 높이면 서버에서 요청을 거부할 수 있음
            const url = `${this.apiBaseUrl}/chat-room/${chatroomId}/messages?limit=2000`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (!response.ok) throw new Error(`'${chatroomId}' 메시지 로드 실패: ${response.status}`);
            const data = await response.json();
            return (data.data.list || []);
        }
    };

    const contentGenerator = {
        generateTxt(messages) {
            return messages.map(msg => `[${msg.role === 'user' ? 'user' : 'assistant'} message]\n\n${msg.content}`).join('\n\n===\n\n');
        },
        generateJson(messages) {
            const filtered = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            return JSON.stringify(filtered, null, 2);
        },
        generateHtml(messages, characterName) {
            const renderer = new marked.Renderer();
            renderer.heading = (text, level) => `<h${level}>${text}</h${level}>`;
            renderer.strong = (text) => `<strong>${text}</strong>`;
            renderer.em = (text) => `<em>${text}</em>`;
            renderer.list = (body, ordered) => `<${ordered ? 'ol' : 'ul'}>${body}</${ordered ? 'ol' : 'ul'}>`;
            renderer.listitem = (text) => `<li>${text}</li>`;
            renderer.blockquote = (quote) => `<blockquote>${quote}</blockquote>`;
            renderer.hr = () => '<hr>';
            renderer.image = (href, title, text) => `<div><img src="${href}" alt="${text}"></div>`;
            renderer.code = (code) => `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
            delete renderer.paragraph;
            marked.setOptions({
                renderer,
                gfm: true,
                breaks: true
            });

            const messageHtml = messages.map(msg => {
                let contentHtml = marked.parse(msg.content || '');
                contentHtml = contentHtml.replace(/<p>/g, `<div>`).replace(/<\/p>/g, '</div>');
                const roleClass = msg.role === 'user' ? 'user' : 'assistant';
                const actionButtonHtml = `<div class="message-actions"><button class="action-btn delete-btn">${ICONS.trash}</button><div class="message-checkbox"><span class="checkbox-icon unchecked">${ICONS.unchecked}</span><span class="checkbox-icon checked">${ICONS.checked}</span></div></div>`;
                return `<div class="message-wrapper ${roleClass}">${msg.role === 'assistant' ? `<div class="character-name-wrapper"><div class="character-name">${characterName}</div></div>` : ''}<div class="message-bubble ${roleClass}-bubble">${contentHtml}${actionButtonHtml}</div></div>`;
            }).join('');

            const fullHtmlStyle = `:root{--surface_chat_secondary:#61605A;--text_white:#fff;--text_primary:#1A1918;--text_secondary:#61605A;--text_tertiary:#85837D;--text_disabled:#C7C5BD;--icon_tertiary:#85837D;--icon_white:#fff}body{font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;background-color:#fff;margin:0;padding-bottom:80px}body.edit-mode{padding-bottom:60px}.chat-container{max-width:800px;margin:0 auto;padding:20px;display:flex;flex-direction:column}.message-wrapper{display:flex;flex-direction:column;margin-bottom:15px}.message-wrapper.user{align-items:flex-end}.message-wrapper.assistant{align-items:flex-start}.character-name-wrapper{display:flex}.character-name{font-size:14px;color:var(--text_secondary);margin-bottom:5px;padding-left:10px}.message-bubble{position:relative;line-height:1.6;word-wrap:break-word;box-sizing:border-box}.user-bubble{padding:12px 20px 36px;border-radius:10px 10px 0 10px;background-color:var(--surface_chat_secondary);color:var(--text_white);max-width:640px}.assistant-bubble{padding:16px 20px 36px;border-radius:0 10px 10px;background-color:${CONFIG.assistantBubbleColor};color:var(--text_primary);max-width:740px}body.edit-mode .message-bubble{cursor:pointer}div,p{margin-bottom:1em}div:last-child,p:last-child{margin-bottom:0}.message-bubble h1,.message-bubble h2,.message-bubble h3{color:var(--text_primary);font-weight:700}.user-bubble h1,.user-bubble h2,.user-bubble h3{color:var(--text_white)}.message-bubble ul,.message-bubble ol{padding:4px 0 4px 20px;line-height:180%;font-weight:500;list-style-position:outside}.user-bubble ul,.user-bubble ol{color:var(--text_white)}.assistant-bubble ul,.assistant-bubble ol{color:var(--text_primary)}.message-bubble strong{font-weight:700}.user-bubble strong{color:var(--text_white)}.assistant-bubble strong{color:var(--text_primary)}.message-bubble em{font-style:normal}.assistant-bubble em{color:var(--text_tertiary)}.user-bubble em{color:var(--text_disabled)}.message-bubble blockquote{margin:10px 0;padding:10px 15px;border-left:4px solid #ccc;background-color:#f9f9f9;color:#666}.message-bubble img{max-width:100%;border-radius:5px}.message-bubble pre{background-color:#2d2d2d;color:#f2f2f2;padding:15px;border-radius:5px;white-space:pre-wrap;font-family:monospace}.message-bubble hr{border:none;border-top:1px solid #ddd;margin:1.5em 0}.floating-buttons{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:1002;transition:opacity .3s,bottom .3s,visibility .3s,pointer-events 0s .3s}body.edit-mode .floating-buttons{bottom:80px}.floating-btn{width:40px;height:40px;border-radius:50%;background-color:#333333;color:#fff;border:none;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,.2)}.floating-btn:hover{opacity:.8}.floating-btn svg{width:20px;height:20px}.message-actions{position:absolute;bottom:8px;right:8px;width:24px;height:24px;display:flex;justify-content:center;align-items:center}.action-btn,.message-checkbox{position:absolute;top:0;left:0;width:100%;height:100%;display:none;justify-content:center;align-items:center;background-color:transparent;border:none;padding:0;cursor:pointer;box-sizing:border-box}.action-btn svg{width:20px;height:20px}.message-checkbox svg{width:16px;height:16px}.user-bubble .action-btn svg,.user-bubble .message-checkbox svg{fill:var(--icon_white)}.assistant-bubble .action-btn svg,.assistant-bubble .message-checkbox svg{fill:var(--icon_tertiary)}body:not(.edit-mode) .delete-btn{display:flex}body.edit-mode .message-checkbox{display:flex}.checkbox-icon.checked{display:none}.message-wrapper.selected .checkbox-icon.checked{display:block}.message-wrapper.selected .checkbox-icon.unchecked{display:none}.delete-confirm-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:1003}.delete-confirm-panel{display:flex;flex-direction:column;padding:32px 24px 20px;width:320px;background-color:#fff;border-radius:10px;text-align:center}.delete-confirm-panel .text-group{flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px;padding-bottom:16px}.delete-confirm-panel .title{color:#1a1918;font-size:18px;font-weight:700;margin:0}.delete-confirm-panel .subtitle{color:#61605a;font-size:14px;margin:0}.delete-confirm-buttons{display:flex;width:100%;gap:8px}.delete-confirm-buttons button{flex:1;padding:0 20px;height:40px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;border:none}.delete-confirm-cancel{background-color:#f0efeb;color:#1a1918}.delete-confirm-delete{background-color:#0d0d0c;color:#fcfcfa}.save-changes-container{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;display:none}.save-changes-btn{padding:12px 24px;border-radius:100px;border:none;background-color:#FF4432;color:#fff;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)}#edit-action-bar{position:fixed;bottom:0!important;left:0;width:100%;background-color:#333;color:#fff;display:none;align-items:center;padding:12px 20px!important;margin:0!important;box-sizing:border-box;z-index:1001}body.edit-mode #edit-action-bar{display:flex}#selection-count{font-size:16px;font-weight:600;flex-grow:1;text-align:center;margin-left:auto}.action-bar-buttons{display:flex;gap:8px;align-items:center;margin-left:auto}.action-bar-btn{background:0 0;border:none;color:#fff;cursor:pointer;padding:8px;display:flex;align-items:center;justify-content:center}.action-bar-btn svg{width:24px;height:24px}#bulk-delete-btn{opacity:1;transition:opacity .2s}#bulk-delete-btn:disabled{opacity:.5;cursor:not-allowed}@media (min-width:769px){#bulk-delete-btn svg,#exit-edit-mode-btn svg{width:28px;height:28px}}@media (max-width:768px){body{padding-bottom:80px}body.edit-mode{padding-bottom:60px}body.edit-mode .floating-buttons, body.panel-open-mob .floating-buttons {opacity:0;visibility:hidden;pointer-events:none;transition:none}.floating-buttons.init-hide{opacity:0;visibility:hidden;pointer-events:none}.floating-buttons.visible{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .3s,bottom .3s,visibility .3s,pointer-events 0s .3s}.floating-btn{width:50px;height:50px;font-size:28px}.floating-btn svg{width:24px;height:24px}}@media (max-width:840px){body{font-size:13px}.chat-container{padding:10px 5px}.user-bubble,.assistant-bubble{max-width:100%;border-radius:8px}.message-bubble{font-size:1em}.message-bubble h1{font-size:1.5em}.message-bubble h2{font-size:1.3em}.message-bubble h3{font-size:1.15em}.message-wrapper.user,.message-wrapper.assistant{align-items:stretch}}`;
            const embeddedScript = `
                let ccdScrollTimeout;
                const ICONS = { close: \`${ICONS.close}\`, edit: \`${ICONS.edit}\`, trash: \`${ICONS.trash}\`, unchecked: \`${ICONS.unchecked}\`, checked: \`${ICONS.checked}\` };

                function downloadFile(content, fileName, mimeType) { const a = document.createElement('a'); const blob = new Blob([content], { type: mimeType }); a.href = URL.createObjectURL(blob); a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); }
                function showDeleteConfirm({ isBulk, elements }) { if (document.querySelector('.delete-confirm-overlay')) return; const overlay = document.createElement('div'); overlay.className = 'delete-confirm-overlay'; overlay.innerHTML = \`<div class="delete-confirm-panel"><div class="text-group"><p class="title">선택한 메시지를 삭제하시겠습니까?</p><div class="subtitle">삭제 후 변경 사항을 저장하세요</div></div><div class="delete-confirm-buttons"><button class="delete-confirm-cancel" onclick="this.closest('.delete-confirm-overlay').remove()">취소</button><button class="delete-confirm-delete">삭제</button></div></div>\`; const closePopup = () => overlay.remove(); overlay.querySelector('.delete-confirm-delete').onclick = () => { elements.forEach(el => el.remove()); document.querySelector('.save-changes-container').style.display = 'block'; closePopup(); if (isBulk) toggleEditMode(); }; overlay.onclick = (e) => { if (e.target === overlay) closePopup(); }; document.body.appendChild(overlay); }
                function toggleEditMode() {
                    document.body.classList.toggle('edit-mode');
                    const isEditing = document.body.classList.contains('edit-mode');
                    document.getElementById('edit-mode-btn').innerHTML = isEditing ? ICONS.close : ICONS.edit;
                    if (!isEditing) {
                        document.querySelectorAll('.message-wrapper.selected').forEach(el => el.classList.remove('selected'));
                    }
                     if (window.matchMedia("(max-width: 768px)").matches) {
                         const floatingButtons = document.querySelector('.floating-buttons');
                         if(floatingButtons){
                            clearTimeout(ccdScrollTimeout);
                            floatingButtons.classList.remove('visible');
                         }
                    }
                    updateSelectionCount();
                }
                function updateSelectionCount() { const selectedCount = document.querySelectorAll('.message-wrapper.selected').length; document.getElementById('selection-count').textContent = \`\${selectedCount}개 메시지 선택됨\`; document.getElementById('bulk-delete-btn').disabled = (selectedCount === 0); }
                function handleContainerClick(event) { const target = event.target; if (document.body.classList.contains('edit-mode')) { const wrapper = target.closest('.message-wrapper'); if (wrapper) { wrapper.classList.toggle('selected'); updateSelectionCount(); } } else { const deleteBtn = target.closest('.delete-btn'); if (deleteBtn) { showDeleteConfirm({ isBulk: false, elements: [deleteBtn.closest('.message-wrapper')] }); } } }
                function handleBulkDelete() { const bulkDeleteBtn = document.getElementById('bulk-delete-btn'); if (bulkDeleteBtn.disabled) return; const selected = document.querySelectorAll('.message-wrapper.selected'); if (selected.length > 0) { showDeleteConfirm({ isBulk: true, elements: Array.from(selected) }); } }
                function saveChanges() { const originalTitle = document.title.split(' - ')[0]; const fileName = \`\${originalTitle} 채팅로그 수정본.html\`; document.querySelector('.save-changes-container').style.display = 'none'; downloadFile(document.documentElement.outerHTML, fileName, 'text/html;charset=utf-8'); }

                document.addEventListener('DOMContentLoaded', () => {
                    document.getElementById('edit-mode-btn').onclick = toggleEditMode;
                    document.getElementById('scroll-top-btn').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.getElementById('scroll-bottom-btn').onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    document.getElementById('exit-edit-mode-btn').onclick = toggleEditMode;
                    document.getElementById('bulk-delete-btn').onclick = handleBulkDelete;
                    document.querySelector('.chat-container').addEventListener('click', handleContainerClick);
                });

                if (window.matchMedia("(max-width: 768px)").matches) { const floatingButtons = document.querySelector('.floating-buttons'); if (floatingButtons) { floatingButtons.classList.add('init-hide'); window.addEventListener('scroll', () => { if (document.body.classList.contains('edit-mode') || document.body.classList.contains('panel-open-mob')) return; clearTimeout(ccdScrollTimeout); floatingButtons.classList.add('visible'); ccdScrollTimeout = setTimeout(() => { floatingButtons.classList.remove('visible'); }, 1500); }); } }
            `;
            return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${characterName} Chat Log</title><style>${fullHtmlStyle}</style></head><body><div class="chat-container">${messageHtml}</div><div class="floating-buttons"><button id="edit-mode-btn" class="floating-btn">${ICONS.edit}</button><button id="scroll-top-btn" class="floating-btn">${ICONS.arrowUp}</button><button id="scroll-bottom-btn" class="floating-btn">${ICONS.arrowDown}</button></div><div id="edit-action-bar"><span id="selection-count">0개 메시지 선택됨</span><div class="action-bar-buttons"><button id="bulk-delete-btn" class="action-bar-btn">${ICONS.trash}</button><button id="exit-edit-mode-btn" class="action-bar-btn">${ICONS.close}</button></div></div><div class="save-changes-container"><button id="save-changes-btn" class="save-changes-btn" onclick="saveChanges()">변경 사항 저장</button></div><script>${embeddedScript}<\/script></body></html>`;
        },
        generateFullHtml(allChatsData, currentChatroomId, pakoCode) {
            const compressedChatDataStore = {};
            const searchIndex = [];

            allChatsData.forEach((chatRoomObject, index) => {
                const characterName = chatRoomObject.character?.name || chatRoomObject.title || '';
                const messagesContent = chatRoomObject.messages.map(msg => msg.content).join(' ');
                const fullSearchableText = (characterName + ' ' + messagesContent).toLowerCase();
                searchIndex.push({
                    index: index,
                    text: fullSearchableText
                });

                const chatString = JSON.stringify(chatRoomObject);
                const compressedData = pako.gzip(new TextEncoder().encode(chatString));
                let binaryString = "";
                for (let i = 0; i < compressedData.length; i++) {
                    binaryString += String.fromCharCode(compressedData[i]);
                }
                const base64String = btoa(binaryString);
                compressedChatDataStore[index] = base64String;
            });

            const searchIndexString = JSON.stringify(searchIndex);
            const compressedSearchIndex = pako.gzip(new TextEncoder().encode(searchIndexString));
            let searchIndexBinaryString = "";
            for (let i = 0; i < compressedSearchIndex.length; i++) {
                searchIndexBinaryString += String.fromCharCode(compressedSearchIndex[i]);
            }
            const base64CompressedSearchIndex = btoa(searchIndexBinaryString);
            const chatDataStoreJsonString = JSON.stringify(compressedChatDataStore);

            const sidePanelHtml = allChatsData.map((chatData, index) => {
                const character = chatData.character;
                const characterName = character?.name || chatData.title || '알 수 없는 채팅';
                return `<a href="#" class="chat-list-item" data-index="${index}"> <div class="list-item-avatar"><img src="${character?.profileImage?.w200 || ''}" alt="${characterName}"></div> <div class="list-item-content"> <p class="list-item-name">${characterName}</p> <p class="list-item-topic">${chatData.lastMessage || '내용 없음'}</p> </div> </a>`;
            }).join('');

            const fullHtmlStyle = `
                :root { --surface_chat_secondary: #61605A; --text_white: #fff; --text_primary: #1A1918; --text_secondary: #61605A; --text_tertiary: #85837D; --text_disabled: #C7C5BD; --icon_tertiary: #85837D; --icon_white: #fff; --point_red: #FF4432; }
                body { font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif; background-color: #F8F9FA; margin: 0; transition: padding-left .3s ease-in-out; }
                body.panel-open-mob { overflow: hidden; }
                #main-chat-view { max-width: 800px; margin: 0 auto; padding: 20px 20px 80px; }
                .chat-container { display: flex; flex-direction: column; }
                .message-wrapper { display: flex; flex-direction: column; margin-bottom: 15px; }
                .message-wrapper.user { align-items: flex-end; }
                .message-wrapper.assistant { align-items: flex-start; }
                .character-name-wrapper { display: flex; }
                .character-name { font-size: 14px; color: var(--text_secondary); margin-bottom: 5px; padding-left: 10px; }
                .message-bubble { position: relative; line-height: 1.6; word-wrap: break-word; box-sizing: border-box; }
                .user-bubble { padding: 12px 20px; border-radius: 10px 10px 0 10px; background-color: var(--surface_chat_secondary); color: var(--text_white); max-width: 640px; }
                .assistant-bubble { padding: 16px 20px; border-radius: 0 10px 10px; background-color: ${CONFIG.assistantBubbleColor}; color: var(--text_primary); max-width: 740px; box-shadow: 0 1px 3px rgba(0, 0, 0, .05); }
                div, p { margin-bottom: 1em; }
                div:last-child, p:last-child { margin-bottom: 0; }
                .message-bubble h1, .message-bubble h2, .message-bubble h3 { color: var(--text_primary); font-weight: 700; }
                .user-bubble h1, .user-bubble h2, .user-bubble h3 { color: var(--text_white); }
                .message-bubble ul, .message-bubble ol { padding: 4px 0 4px 20px; line-height: 180%; font-weight: 500; list-style-position: outside; }
                .user-bubble ul, .user-bubble ol { color: var(--text_white); }
                .assistant-bubble ul, .assistant-bubble ol { color: var(--text_primary); }
                .message-bubble strong { font-weight: 700; }
                .user-bubble strong { color: var(--text_white); }
                .assistant-bubble strong { color: var(--text_primary); }
                .message-bubble em { font-style: normal; }
                .assistant-bubble em { color: var(--text_tertiary); }
                .user-bubble em { color: var(--text_disabled); }
                .message-bubble blockquote { margin: 10px 0; padding: 10px 15px; border-left: 4px solid #ccc; background-color: #f9f9f9; color: #666; }
                .message-bubble img { max-width: 100%; }
                .message-bubble pre { background-color: #2d2d2d; color: #f2f2f2; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: monospace; }
                .message-bubble hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
                .floating-buttons { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 1002; }
                .floating-btn { width: 40px; height: 40px; border-radius: 50%; background-color: #333; color: #fff; border: none; cursor: pointer; font-size: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0, 0, 0, .2); }
                .floating-btn svg { width: 20px; height: 20px; }
                #chat-list-panel { position: fixed; top: 0; left: 0; width: 260px; height: 100%; background-color: #F7F7F5; border-right: 1px solid #e9ecef; transform: translateX(-100%); transition: transform .3s ease-in-out; z-index: 1002; display: flex; flex-direction: column; }
                #chat-list-panel.is-open { transform: translateX(0); }
                .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #e9ecef; flex-shrink: 0; margin-bottom: 0; }
                .panel-header .title { font-size: 16px; font-weight: 700; color: var(--text_primary); }
                .panel-header-buttons { display: flex; align-items: center; gap: 12px; }
                .header-btn { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .header-btn svg { width: 16px; height: 16px; fill: #1A1918; }
                .header-btn:disabled svg { fill: #85837D; }
                .search-bar-container { max-height: 0; overflow: hidden; transition: max-height .3s ease-in-out, padding .3s ease-in-out, border-bottom-width .3s ease-in-out; padding: 0 16px; border-bottom: 0px solid #e9ecef; margin-bottom: 0 !important; box-sizing: border-box; }
                .search-bar-container.open { max-height: 52px; padding: 10px 16px; border-bottom-width: 1px; }
                #chat-search-input { width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #dee2e6; background-color: #FFFFFF; font-size: 14px; box-sizing: border-box; }
                #chat-search-input:focus { outline: none; border-color: #61650A; }
                .panel-scroll-area { overflow-y: auto; flex-grow: 1; padding: 8px; }
                .panel-scroll-area::-webkit-scrollbar { width: 8px; }
                .panel-scroll-area::-webkit-scrollbar-track { background-color: transparent; }
                .panel-scroll-area::-webkit-scrollbar-thumb { background-color: #85837D; border-radius: 4px; }
                .panel-scroll-area::-webkit-scrollbar-thumb:hover { background-color: #1A1918; }
                .chat-list-item { display: flex; align-items: center; padding: 10px 12px; text-decoration: none; color: inherit; cursor: pointer; border-radius: 8px; margin-bottom: 4px; background-color: transparent; transition: background-color 0.2s ease-in-out; }
                .chat-list-item:hover { background-color: #FFFFFF; }
                .chat-list-item.active { background-color: #FFFFFF; }
                .chat-list-item.hidden { display: none; }
                .list-item-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; margin-right: 12px; flex-shrink: 0; }
                .list-item-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .list-item-content { overflow: hidden; }
                .list-item-name { font-weight: 600; font-size: 14px; color: var(--text_primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 4px; }
                .list-item-topic { font-size: 13px; color: var(--text_secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
                #panel-toggle-btn { position: fixed; top: 50%; left: 0; transform: translateY(-50%); width: 24px; height: 60px; background-color: #f7f7f5; border: 1px solid #e9ecef; border-left: none; border-radius: 0 4px 4px 0; cursor: pointer; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 0; transition: left .3s ease-in-out; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, .12); }
                body.panel-open-pc #panel-toggle-btn { left: 260px; z-index: 1002; }
                #panel-toggle-btn svg { width: 20px; height: 20px; position: relative; }
                #panel-toggle-btn #toggle_bar { transition: transform .3s ease-in-out; }
                #panel-toggle-btn #toggle_open_arrow, #panel-toggle-btn #toggle_close_arrow { position: absolute; opacity: 0; transition: transform .3s ease-in-out, opacity .3s ease-in-out; }
                body:not(.panel-open-pc) #panel-toggle-btn #toggle_open_arrow { transform: translateX(-12px); }
                body:not(.panel-open-pc) #panel-toggle-btn:hover #toggle_bar { transform: translateX(12px); }
                body:not(.panel-open-pc) #panel-toggle-btn:hover #toggle_open_arrow { opacity: 1; transform: translateX(0); }
                body.panel-open-pc #panel-toggle-btn #toggle_close_arrow { transform: translateX(12px); }
                body.panel-open-pc #panel-toggle-btn:hover #toggle_bar { transform: translateX(0); }
                body.panel-open-pc #panel-toggle-btn:hover #toggle_close_arrow { opacity: 1; transform: translateX(0); }
                .un-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, .6); z-index: 2000; display: flex; justify-content: center; align-items: center; }
                .un-modal-content { background-color: #fff; padding: 24px; border-radius: 8px; width: 90%; max-width: 500px; max-height: 80%; display: flex; flex-direction: column; }
                .un-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 18px; font-weight: 700; }
                .un-modal-close-btn { background: 0 0; border: none; cursor: pointer; font-size: 24px; }
                .un-modal-body { overflow-y: auto; white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #343a40; background-color: #f8f9fa; padding: 12px; border-radius: 4px; }
                .un-modal-body::-webkit-scrollbar { width: 8px; }
                .un-modal-body::-webkit-scrollbar-track { background-color: transparent; }
                .un-modal-body::-webkit-scrollbar-thumb { background-color: #CED4DA; border-radius: 4px; }
                .un-modal-body::-webkit-scrollbar-thumb:hover { background-color: #ADB5BD; }
                @media (min-width: 769px) { body.panel-open-pc { padding-left: 260px; } #mobile-list-btn { display: none; } }
                @media (max-width: 768px) { #panel-toggle-btn { display: none; } #chat-list-panel { box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); } body { padding-bottom: 80px; } body.panel-open-pc { padding-left: 0; } #main-content-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, .5); z-index: 1000; display: none; opacity: 0; transition: opacity .3s ease-in-out; } body.panel-open-mob #main-content-overlay { display: block; opacity: 1; } body.panel-open-mob .floating-buttons { opacity: 0; visibility: hidden; pointer-events: none; transition: none; } .floating-buttons.init-hide { opacity: 0; visibility: hidden; pointer-events: none; } .floating-buttons.visible { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .3s, bottom .3s, visibility .3s, pointer-events 0s .3s; } .floating-btn { width: 50px; height: 50px; font-size: 28px; } .floating-btn svg { width: 24px; height: 24px; } }
                @media (max-width: 840px) { #main-chat-view { padding: 10px 5px; } body { font-size: 13px; } .user-bubble, .assistant-bubble { max-width: 100%; border-radius: 8px; } .message-bubble { font-size: 1em; } .message-bubble h1 { font-size: 1.5em; } .message-bubble h2 { font-size: 1.3em; } .message-bubble h3 { font-size: 1.15em; } .message-wrapper.user, .message-wrapper.assistant { align-items: stretch; } }
            `;

            const embeddedScript = `
                let ccdScrollTimeout;
                let chatDataStore;
                let searchIndex;
                const chatCache = new Map();
                const currentChatroomId = "${currentChatroomId}";
                const ICONS = { close: \`${ICONS.close}\`, search: \`${ICONS.search}\`, journal: \`${ICONS.journal}\` };

                function base64ToUint8Array(base64) { const binary_string = atob(base64); const len = binary_string.length; const bytes = new Uint8Array(len); for (let i = 0; i < len; i++) { bytes[i] = binary_string.charCodeAt(i); } return bytes; }

                function _renderChatContent(chatData) {
                    const chatView = document.getElementById('main-chat-view');
                    const character = chatData.character;
                    const characterName = character?.name || chatData.title || '알 수 없는 채팅';
                    const messagesHtml = chatData.messages.map(msg => {
                        const roleClass = msg.role === 'user' ? 'user' : 'assistant';
                        const contentHtml = marked.parse(msg.content || '').replace(/<p>/g, '<div>').replace(/<\\/p>/g, '</div>');
                        return \`<div class="message-wrapper \${roleClass}">\${roleClass === 'assistant' ? \`<div class="character-name-wrapper"><div class="character-name">\${characterName}</div></div>\` : ''}<div class="message-bubble \${roleClass}-bubble">\${contentHtml}</div></div>\`;
                    }).join('');
                    chatView.innerHTML = \`<div class="chat-container">\${messagesHtml}</div>\`;
                    document.title = characterName + ' - 채팅 로그';
                    manageUserNoteButton(chatData);
                }

                function renderChat(index) {
                    if (chatCache.has(index)) {
                        _renderChatContent(chatCache.get(index));
                    } else {
                        const base64Data = chatDataStore[index];
                        if (!base64Data) return;
                        const compressedData = base64ToUint8Array(base64Data);
                        const decompressedJson = new TextDecoder().decode(pako.ungzip(compressedData));
                        const chatData = JSON.parse(decompressedJson);
                        chatCache.set(index, chatData);
                        _renderChatContent(chatData);
                    }
                    document.querySelectorAll('.chat-list-item').forEach(link => link.classList.remove('active'));
                    const activeLink = document.querySelector(\`.chat-list-item[data-index="\${index}"]\`);
                    if(activeLink) activeLink.classList.add('active');
                    window.scrollTo({ top: 0, behavior: 'auto' });
                    if (document.getElementById('chat-list-panel').classList.contains('is-open') && window.innerWidth <= 768) {
                        toggleChatList();
                    }
                }

                function manageUserNoteButton(chatData) {
                    const btn = document.getElementById('user-note-btn');
                    if (!btn) return;
                    const userNote = chatData && chatData.character ? chatData.character.userNote : null;
                    if (userNote && typeof userNote.content === 'string' && userNote.content.trim() !== '') {
                        btn.disabled = false;
                        btn.onclick = () => showUserNoteModal(userNote.content);
                    } else {
                        btn.disabled = true;
                        btn.onclick = null;
                    }
                }

                function showUserNoteModal(content) {
                    const modal = document.createElement('div');
                    modal.className = 'un-modal-overlay';
                    modal.innerHTML = \`<div class="un-modal-content"><div class="un-modal-header"><span>유저 노트</span><button class="un-modal-close-btn">${ICONS.close}</button></div><div class="un-modal-body">\${content || '입력된 유저노트가 없습니다.'}</div></div>\`;
                    const close = () => modal.remove();
                    modal.querySelector('.un-modal-close-btn').onclick = close;
                    modal.onclick = (e) => { if (e.target === modal) close(); };
                    document.body.appendChild(modal);
                }

                function toggleChatList() {
                    const isMobile = window.innerWidth <= 768;
                    const bodyClass = isMobile ? 'panel-open-mob' : 'panel-open-pc';
                    const panelIsOpen = document.body.classList.contains(bodyClass);
                    if (isMobile && !panelIsOpen) {
                        const floatingButtons = document.querySelector('.floating-buttons');
                        if (floatingButtons) { clearTimeout(ccdScrollTimeout); floatingButtons.classList.remove('visible'); }
                    }
                    document.getElementById('chat-list-panel').classList.toggle('is-open');
                    document.body.classList.toggle(bodyClass);
                }

                function toggleSearchBar() { document.querySelector('.search-bar-container').classList.toggle('open'); }

                function handleSearch(event) {
                    const searchTerm = event.target.value.toLowerCase();
                    searchIndex.forEach(item => {
                        const listItem = document.querySelector(\`.chat-list-item[data-index="\${item.index}"]\`);
                        if (listItem) {
                            const isVisible = item.text.includes(searchTerm);
                            listItem.classList.toggle('hidden', !isVisible);
                        }
                    });
                }

                function createHeaderButtons() { const container = document.querySelector('.panel-header-buttons'); if (!container) return; const searchBtn = document.createElement('button'); searchBtn.id = 'search-btn'; searchBtn.className = 'header-btn'; searchBtn.innerHTML = ICONS.search; const userNoteBtn = document.createElement('button'); userNoteBtn.id = 'user-note-btn'; userNoteBtn.className = 'header-btn'; userNoteBtn.innerHTML = ICONS.journal; userNoteBtn.disabled = true; container.appendChild(searchBtn); container.appendChild(userNoteBtn); }

                function setupEventListeners() {
                    createHeaderButtons();
                    document.getElementById('panel-toggle-btn').onclick = toggleChatList;
                    document.getElementById('main-content-overlay').onclick = toggleChatList;
                    document.getElementById('mobile-list-btn').onclick = toggleChatList;
                    document.getElementById('search-btn').onclick = toggleSearchBar;
                    document.getElementById('chat-search-input').addEventListener('input', handleSearch);
                    document.querySelectorAll('.chat-list-item').forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); renderChat(parseInt(e.currentTarget.dataset.index, 10)); }); });
                    const fabContainer = document.querySelector('.floating-buttons');
                    const scrollButtons = fabContainer.querySelectorAll('.floating-btn:not([id])');
                    if (scrollButtons[0]) scrollButtons[0].onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (scrollButtons[1]) scrollButtons[1].onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    if (window.matchMedia("(max-width: 768px)").matches) { if (fabContainer) { fabContainer.classList.add('init-hide'); window.addEventListener('scroll', () => { if (document.body.classList.contains('panel-open-mob')) return; clearTimeout(ccdScrollTimeout); fabContainer.classList.add('visible'); ccdScrollTimeout = setTimeout(() => { fabContainer.classList.remove('visible'); }, 1500); }); } }
                }

                document.addEventListener('DOMContentLoaded', () => {
                    const chatDataElem = document.getElementById('compressed-chat-data');
                    chatDataStore = JSON.parse(chatDataElem.textContent);

                    const searchIndexElem = document.getElementById('compressed-search-index');
                    const compressedSearchData = base64ToUint8Array(searchIndexElem.textContent);
                    searchIndex = JSON.parse(new TextDecoder().decode(pako.ungzip(compressedSearchData)));

                    marked.setOptions({ gfm: true, breaks: true });
                    setupEventListeners();

                    let initialIndex = 0;
                    if (currentChatroomId) {
                        const chatDataForId = Object.values(chatDataStore).map(b64 => JSON.parse(new TextDecoder().decode(pako.ungzip(base64ToUint8Array(b64)))));
                        const foundIndex = chatDataForId.findIndex(chat => chat._id === currentChatroomId);
                        if (foundIndex > -1) initialIndex = foundIndex;
                    }
                    if (Object.keys(chatDataStore).length > 0) {
                        renderChat(initialIndex);
                    }
                });
            `;

            return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>전체 채팅 백업</title><style>${fullHtmlStyle}</style><script src="https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js"><\/script></head><body>
                <button id="panel-toggle-btn">${ICONS.panelToggle}</button>
                <div id="main-content-overlay"></div>
                <div id="chat-list-panel">
                    <div class="panel-header"><span class="title">대화 내역</span><div class="panel-header-buttons"></div></div>
                    <div class="search-bar-container"><input type="text" id="chat-search-input" placeholder="이름이나 내용을 검색하세요"></div>
                    <div class="panel-scroll-area">${sidePanelHtml}</div>
                </div>
                <div id="main-chat-view"></div>
                <div class="floating-buttons">
                    <button id="mobile-list-btn" class="floating-btn">${ICONS.list}</button>
                    <button class="floating-btn">${ICONS.arrowUp}</button>
                    <button class="floating-btn">${ICONS.arrowDown}</button>
                </div>
                <script id="pako-lib">${pakoCode}<\/script>
                <script type="application/json" id="compressed-chat-data">${chatDataStoreJsonString}</script>
                <script type="application/octet-stream" id="compressed-search-index">${base64CompressedSearchIndex}</script>
                <script>${embeddedScript}<\/script></body></html>`;
        }
    };

    const utils = {
        downloadFile(content, fileName, mimeType) { const a = document.createElement('a'); const blob = new Blob([content], { type: mimeType }); a.href = URL.createObjectURL(blob); a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); },
        async copyToClipboard(text, statusEl, successMsg) { try { await navigator.clipboard.writeText(text); this.updateStatus(statusEl, `${successMsg} 클립보드에 복사되었습니다.`, 'success'); } catch (err) { this.updateStatus(statusEl, '클립보드 복사에 실패했습니다.', 'error'); console.error('Clipboard copy failed:', err); } },
        updateStatus(statusEl, message, type = 'info') {
            if(!statusEl) return;
            const icon = type === 'success' ? ICONS.success : type === 'error' ? ICONS.error : '';
            statusEl.innerHTML = `${icon} <span>${message}</span>`;
            statusEl.className = `status-text status-${type}`;
        }
    };

    const app = {
        init() {
            this.libraryCache = {};
            this.injectStyles();
            let observer = null; let injectionInterval = null;
            const onInjectionSuccess = () => { if (observer) { observer.disconnect(); observer = null; } if (injectionInterval) { clearInterval(injectionInterval); injectionInterval = null; } console.log('[CCD] 버튼 주입 성공. 감시 작업을 중단합니다.'); };
            observer = new MutationObserver(() => { if (!observer) return; if (document.querySelector('.chat-log-downloader-btn-desktop, .chat-log-downloader-btn-mobile')) { onInjectionSuccess(); return; } if (this.injectButton()) { onInjectionSuccess(); } });
            observer.observe(document.body, { childList: true, subtree: true });
            injectionInterval = setInterval(() => { if (!injectionInterval) return; if (document.querySelector('.chat-log-downloader-btn-desktop, .chat-log-downloader-btn-mobile')) { onInjectionSuccess(); return; } if (this.injectButton()) { onInjectionSuccess(); } }, 1000);
        },
        injectStyles() {
            GM_addStyle(`
                .chat-log-downloader-btn-desktop { display:flex; align-items:center; justify-content:center; height:34px; padding:0 12px; margin:0 8px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; color:#FF4432; background-color:transparent; border:1px solid #FF4432; white-space:nowrap; gap:6px; transition: background-color .2s, color .2s; }
                .chat-log-downloader-btn-desktop:hover { background-color:rgba(0, 0, 0, 0.03);}
                .chat-log-downloader-btn-desktop .icon-box{ display:flex; }
                .chat-log-downloader-btn-mobile { display:flex; align-items:center; justify-content:center; min-height:48px; padding:0 12px; margin:16px; border-radius:8px; cursor:pointer; font-size:16px; font-weight:600; color:#FF4432; background-color:transparent; border:1px solid #FF4432; white-space:nowrap; gap:8px; flex-shrink: 0; }
                .downloader-panel-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,.6); display:flex; justify-content:center; align-items:center; z-index:9999; }
                .downloader-panel { background-color:#fff; padding:28px; border-radius:12px; width:420px; box-sizing:border-box; box-shadow:0 4px 12px rgba(0,0,0,.15); font-family:Pretendard,sans-serif; color:#1A1918; display:flex; flex-direction:column; }
                .downloader-header { display:flex; align-items:center; gap: 8px; margin-bottom: 24px; }
                .downloader-title { margin:0; font-size:22px; font-weight:700; }
                .downloader-close-btn { background:0 0; border:none; cursor:pointer; padding:0; font-size:24px; color:#85837D; line-height:1; margin-left: auto; transition: color .2s; }
                .downloader-close-btn:hover { color: #1A1918; }
                .ccd-version-display{ font-size:12px; font-weight:500; color:#b0b0b0; }
                .status-text { text-align:center; height: 38px; box-sizing:border-box; display:flex; align-items:center; justify-content:center; gap: 6px; font-size:13px; padding-top: 12px; transition: color .2s; }
                .status-text.status-info { color:#85837D; }
                .status-text.status-success { color:#28a745; }
                .status-text.status-error { color:#FF4432; }
                .tab-control { display: flex; background-color: #F1F3F5; border-radius: 8px; padding: 4px; }
                .tab-btn { flex: 1; padding: 10px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; background-color: transparent; color: #85837D; transition: background-color 0.2s, color 0.2s; }
                .tab-btn.active { background-color: #fff; color: #FF4432; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .tab-content-wrapper { padding-top: 24px; height: 350px; }
                .tab-content { display: none; }
                .tab-content.active { display: flex; flex-direction: column; height: 100%; }
                .ccd-top-box { height: 215px; border-radius: 8px; padding: 16px; box-sizing: border-box; }
                #tab-content-current .ccd-top-box { background-color:#F8F9FA; display:flex; flex-direction:column; gap:16px; }
                #tab-content-full .ccd-top-box { background-color: #FFFBEB; border: 1px solid #FDE68A; display: flex; flex-direction: column; justify-content: center; }
                .input-group label { display:block; margin-bottom:8px; font-weight:600; font-size:14px; color:#495057; }
                #tab-content-current input[type=number] { width:100%; padding:12px; border:1px solid #DEE2E6; border-radius:8px; font-size:16px; box-sizing:border-box; background-color:#FFF; transition: border-color .2s; }
                #tab-content-current input[type=number]:focus { border-color: #FF4432; outline:none; }
                .save-order-buttons { display:flex; gap:8px; }
                .save-order-btn { flex:1; padding:12px; border-radius:8px; border:1px solid #DEE2E6; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s; background-color:#FFF; color:#495057; }
                .save-order-btn.active { background-color:#FF4432; color:#fff; border-color:#FF4432; }
                .warning-header { display: flex; justify-content: center; align-items: center; gap: 8px; color: #D97706; font-weight: 700; font-size: 16px; margin-bottom: 12px; }
                .warning-content { font-size: 13px; color: #4B5563; line-height: 1.7; text-align: left; display: flex; flex-direction: column; align-items: center; }
                .warning-content p { margin: 0; }
                .warning-content p:not(:last-child) { margin-bottom: 1em; }
                .ccd-action-buttons { margin-top: auto; }
                .format-buttons { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; }
                .format-btn, .full-save-btn { display:flex; align-items:center; justify-content:center; gap: 8px; padding: 16px; border-radius: 8px; border: none; font-size: 16px; font-weight: 700; cursor:pointer; background-color:#FF4432; color:#fff; transition: background-color 0.2s; }
                .format-btn:hover, .full-save-btn:hover { background-color: #E03E2D; }
                .format-btn:disabled, .full-save-btn:disabled { background-color:#ADB5BD; border-color:#ADB5BD; cursor:not-allowed; }
                .full-save-btn { width: 100%; }
                .ccd-bottom-options { height: 41px; display:flex; align-items:center; justify-content:center; }
                .checkbox-group { gap:8px; }
                .checkbox-group label { margin:0; font-size:14px; color:#85837D; cursor:pointer; }
                .checkbox-group input { cursor:pointer; }
                .info-text { font-size: 14px; color: #85837D; }
                .spinner-anim { animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `);
        },
        injectButton() {
            if (document.querySelector('.chat-log-downloader-btn-desktop, .chat-log-downloader-btn-mobile')) return true;
            if (!/\/u\/[a-f0-9]+\/c\/[a-f0-9]+/.test(location.pathname)) return false; const isMobile = window.matchMedia("(max-width: 768px)").matches;
            if (isMobile) { const sidePanel = document.querySelector('.css-1aem01m.eh9908w0'); if (!sidePanel) return false; const scrollableContent = sidePanel.querySelector('.css-j7qwjs'); if (!scrollableContent) return false; const saveButton = document.createElement('button'); saveButton.className = 'chat-log-downloader-btn-mobile'; saveButton.innerHTML = `<span class="icon-box">${ICONS.chat}</span><span>채팅 내용 저장</span>`; saveButton.addEventListener('click', () => this.showPopupPanel()); scrollableContent.appendChild(saveButton); const panelSelector = '.' + sidePanel.className.trim().replace(/\s+/g, '.'); const scrollSelector = '.' + scrollableContent.className.trim().replace(/\s+/g, '.'); GM_addStyle(`@media (max-width: 768px) { ${panelSelector} { display: flex !important; flex-direction: column !important; height: 100%; max-height: 100dvh; } ${scrollSelector} { flex: 1 1 auto; overflow-y: auto !important; } }`);
            } else { const target = document.querySelector(SELECTORS.buttons.desktopInjectTarget); if (!target) return false; const saveButton = document.createElement('button'); saveButton.className = 'chat-log-downloader-btn-desktop'; saveButton.innerHTML = `<span class="icon-box">${ICONS.chat}</span><span>채팅 내용 저장</span>`; saveButton.addEventListener('click', () => this.showPopupPanel()); target.parentElement.parentElement.insertBefore(saveButton, target.parentElement); }
            return true;
        },
        showPopupPanel() {
            if (document.querySelector(SELECTORS.panel.overlay)) return;
            const panelContainer = document.createElement('div');
            panelContainer.className = 'downloader-panel-container';
            panelContainer.innerHTML = this.getPanelHtml();
            document.body.appendChild(panelContainer);
            const panelOverlay = document.querySelector(SELECTORS.panel.overlay);
            panelOverlay.onclick = (e) => { if (e.target === panelOverlay) this.closePopupPanel(); };
            panelOverlay.querySelector(SELECTORS.panel.closeBtn).addEventListener('click', this.closePopupPanel);
            const tabButtons = panelOverlay.querySelectorAll('.tab-btn'); const tabContents = panelOverlay.querySelectorAll('.tab-content');
            tabButtons.forEach(button => { button.addEventListener('click', () => { tabButtons.forEach(btn => btn.classList.remove('active')); tabContents.forEach(content => content.classList.remove('active')); button.classList.add('active'); panelOverlay.querySelector(`#tab-content-${button.dataset.tab}`).classList.add('active'); }); });
            panelOverlay.querySelector('#tab-content-current .format-buttons').addEventListener('click', (e) => { const button = e.target.closest('.format-btn'); if (button) this.startCurrentDownloadProcess(button); });
            panelOverlay.querySelector('#tab-content-current .save-order-buttons').addEventListener('click', (e) => { const clickedBtn = e.target.closest('.save-order-btn'); if (!clickedBtn || clickedBtn.classList.contains('active')) return; panelOverlay.querySelector('.save-order-btn.active').classList.remove('active'); clickedBtn.classList.add('active'); });
            panelOverlay.querySelector('#tab-content-full .full-save-btn').addEventListener('click', (e) => this.startFullDownloadProcess(e.currentTarget));
        },
        getPanelHtml() {
            const version = GM_info.script.version;
            const lastTurnCount = localStorage.getItem(CONFIG.storageKey) || 30;
            const lastSaveOrder = localStorage.getItem(CONFIG.saveOrderKey) || 'latest';
            const isOldestActive = lastSaveOrder === 'oldest' ? 'active' : '';
            const isLatestActive = lastSaveOrder === 'latest' ? 'active' : '';
            return `<div class="downloader-panel-overlay"><div class="downloader-panel">
                <div class="downloader-header"><h2 class="downloader-title">채팅 저장 설정</h2><span class="ccd-version-display">v${version}</span><button id="downloader-close-btn" class="downloader-close-btn">${ICONS.close}</button></div>
                <div class="tab-control"><button class="tab-btn active" data-tab="current">현재 채팅 저장</button><button class="tab-btn" data-tab="full">전체 채팅 저장</button></div>
                <div class="tab-content-wrapper">
                    <div id="tab-content-current" class="tab-content active">
                        <div class="ccd-top-box">
                            <div class="input-group">
                                <!-- [턴 상한 수정 가이드 2/3] - UI 텍스트 -->
                                <!-- 아래 라벨의 '(최대 1000)' 텍스트를 원하는 상한값으로 변경 -->
                                <!-- [!예시!] 2000턴으로 올리려면 '(최대 2000)'으로 변경 -->
                                <label for="message-count-input">저장할 턴 수 (최대 1000)</label>
                                <!-- [턴 상한 수정 가이드 2/3] - UI 입력 제한 -->
                                <!-- 아래 입력창의 max="1000" 값을 원하는 상한값으로 변경 -->
                                <!-- [!예시!] 2000턴으로 올리려면 max="2000"으로 변경 -->
                                <input type="number" id="message-count-input" value="${lastTurnCount}" min="1" max="1000">
                            </div>
                            <div class="input-group"><label>저장할 순서</label><div class="save-order-buttons"><button class="save-order-btn ${isOldestActive}" data-order="oldest">시작 대화부터</button><button class="save-order-btn ${isLatestActive}" data-order="latest">최신 대화부터</button></div></div>
                        </div>
                        <div class="ccd-action-buttons format-buttons"><button data-format="html" class="format-btn">HTML</button><button data-format="txt" class="format-btn">TXT</button><button data-format="json" class="format-btn">JSON</button></div>
                        <div class="ccd-bottom-options checkbox-group"><input type="checkbox" id="copy-clipboard-checkbox"><label for="copy-clipboard-checkbox">클립보드에 복사하기</label></div>
                    </div>
                    <div id="tab-content-full" class="tab-content">
                        <div class="ccd-top-box warning-box">
                            <div class="warning-header"><span>⚠</span><span>서버 부하에 주의하세요</span><span>⚠</span></div>
                            <div class="warning-content">
                                <p><strong>어떻게 작동하나요?</strong><br>
                                먼저 모든 채팅방 목록을 가져온 다음, 각 채팅방의 대화를 순서대로 불러와 하나의 HTML 파일로 저장합니다.</p>
                                <p><strong>왜 주의가 필요한가요?</strong><br>
                                서버에게 짧은 시간에 많은 요청을 보냅니다. 채팅방이 많을수록 부하가 증가합니다. 서버 안정성을 위해 필요할 때만 사용하세요.</p>
                            </div>
                        </div>
                        <div class="ccd-action-buttons">
                            <button class="full-save-btn"><span>저장하기</span></button>
                        </div>
                        <div class="ccd-bottom-options">
                            <span class="info-text">채팅방이 많을수록 소요 시간이 늘어납니다</span>
                        </div>
                    </div>
                </div>
                <div class="status-text status-info"></div>
            </div></div>`;
        },
        closePopupPanel() {
            const panel = document.querySelector('.downloader-panel-container'); if (panel) panel.remove();
        },
        async startCurrentDownloadProcess(button) {
            const statusEl = document.querySelector(SELECTORS.panel.statusText);
            const format = button.dataset.format;
            button.innerHTML = `<span class="spinner-anim">${ICONS.spinner}</span>`;
            document.querySelectorAll('#tab-content-current .format-btn').forEach(btn => btn.disabled = true);

            try {
                const turnCount = parseInt(document.querySelector('#message-count-input').value, 10);
                const saveOrder = document.querySelector('#tab-content-current .save-order-btn.active').dataset.order;
                const shouldCopy = document.querySelector('#copy-clipboard-checkbox').checked;

                // [턴 상한 수정 가이드 3/3]
                // 아래 조건문의 'turnCount > 1000'은 내부적으로 허용하는 최대 턴 수
                // 만약 턴 수 상한을 2000턴으로 올리고 싶다면, 값을 'turnCount > 2000'으로 변경
                // [!권장!] '턴 수는 1에서 1000 사이여야 합니다.' 오류 메시지는 고치면 좋고 안 고쳐도 상관없음
                if (isNaN(turnCount) || turnCount <= 0 || turnCount > 1000) throw new Error('턴 수는 1에서 1000 사이여야 합니다.');
                utils.updateStatus(statusEl, '채팅방 정보를 확인 중...', 'info');
                const chatInfo = apiHandler.getChatInfo(); if (!chatInfo) throw new Error('채팅방 정보를 찾을 수 없습니다.');
                utils.updateStatus(statusEl, '대화 기록을 불러오는 중...', 'info');
                const accessToken = apiHandler.extractCookie('access_token'); if (!accessToken) throw new Error('로그인이 필요합니다.');

                let allMessages = await apiHandler.fetchAllMessages(chatInfo.chatroomId, accessToken);
                if (!allMessages.length) throw new Error('불러올 대화 기록이 없습니다.');

                const messagesToProcess = (saveOrder === 'latest') ? allMessages.slice(0, turnCount * 2) : allMessages.slice(-turnCount * 2);

                const characterName = document.querySelector(SELECTORS.characterName)?.textContent || '캐릭터';
                const safeName = characterName.replace(/[\\/:*?"<>|]/g, '').trim(); const fileName = `${safeName}.${format}`;
                utils.updateStatus(statusEl, '파일을 생성하는 중...', 'info');

                let fileContent, clipboardContent;

                const chronologicalMessages = [...messagesToProcess].reverse();

                switch (format) {
                    case 'html':
                        fileContent = contentGenerator.generateHtml(chronologicalMessages, characterName);
                        clipboardContent = contentGenerator.generateTxt(chronologicalMessages);
                        break;

                    case 'txt':
                        fileContent = contentGenerator.generateTxt(chronologicalMessages);
                        clipboardContent = fileContent;
                        break;

                    case 'json':
                    default:
                        fileContent = contentGenerator.generateJson(messagesToProcess);
                        clipboardContent = fileContent;
                        break;
                }

                const mimeTypes = { html: 'text/html;charset=utf-8', txt: 'text/plain;charset=utf-8', json: 'application/json;charset=utf-8' };
                utils.downloadFile(fileContent, fileName, mimeTypes[format]);
                localStorage.setItem(CONFIG.storageKey, turnCount); localStorage.setItem(CONFIG.saveOrderKey, saveOrder);
                const savedTurns = Math.ceil(messagesToProcess.length / 2);
                const successMsg = `다운로드 성공! 총 ${savedTurns}턴(${messagesToProcess.length}개) 저장.`;
                if (shouldCopy) { await utils.copyToClipboard(clipboardContent, statusEl, successMsg); } else { utils.updateStatus(statusEl, successMsg, 'success'); }
            } catch (error) { console.error('다운로드 실패:', error); utils.updateStatus(statusEl, `오류: ${error.message}`, 'error'); }
            finally {
                document.querySelectorAll('#tab-content-current .format-btn').forEach(btn => {
                    btn.innerHTML = btn.dataset.format.toUpperCase();
                    btn.disabled = false;
                });
            }
        },
        async startFullDownloadProcess(button) {
            const statusEl = document.querySelector(SELECTORS.panel.statusText);
            const originalText = button.innerHTML;
            button.innerHTML = `<span class="spinner-anim">${ICONS.spinner}</span> <span>저장 중...</span>`;
            button.disabled = true;

            try {
                utils.updateStatus(statusEl, '내장 라이브러리 로드 중...', 'info');
                if (!this.libraryCache.pako) {
                    this.libraryCache.pako = await fetch('https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js').then(res => res.text());
                }

                utils.updateStatus(statusEl, '인증 정보를 확인하는 중...', 'info');
                const accessToken = apiHandler.extractCookie('access_token'); if (!accessToken) throw new Error('로그인이 필요합니다.');
                utils.updateStatus(statusEl, '전체 채팅방 목록을 불러오는 중...', 'info');
                const chatrooms = await apiHandler.fetchAllChatrooms(accessToken, (page, count) => { utils.updateStatus(statusEl, `전체 채팅방 목록 페이지 ${page} 로드 중... (${count}개)`, 'info'); });
                if (!chatrooms.length) throw new Error('불러올 채팅방이 없습니다.');
                const allChatsData = [];
                for (let i = 0; i < chatrooms.length; i++) {
                    const room = chatrooms[i]; const characterName = room.character?.name || room.title || '알 수 없는 캐릭터';
                    utils.updateStatus(statusEl, `[${i + 1}/${chatrooms.length}] "${characterName}" 대화 내용 불러오는 중...`, 'info');
                    try {
                        const messages = await apiHandler.fetchAllMessages(room._id, accessToken);
                        allChatsData.push({ ...room, messages: messages.reverse() });
                    }
                    catch (e) { console.error(`"${characterName}" 채팅방(${room._id}) 로드 실패:`, e); allChatsData.push({ ...room, messages: [] }); }
                    if (i < chatrooms.length - 1) { await new Promise(resolve => setTimeout(resolve, CONFIG.fullSaveDelay)); }
                }
                utils.updateStatus(statusEl, '데이터 압축 및 HTML 파일 생성 중...', 'info');
                const currentChatInfo = apiHandler.getChatInfo();
                const fullHtmlContent = contentGenerator.generateFullHtml(allChatsData, currentChatInfo ? currentChatInfo.chatroomId : null, this.libraryCache.pako);
                const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                utils.downloadFile(fullHtmlContent, `크랙 전체 채팅_${timestamp}.html`, 'text/html;charset=utf-8');
                utils.updateStatus(statusEl, `전체 백업 성공! 총 ${chatrooms.length}개의 채팅방을 저장했습니다.`, 'success');
            } catch (error) { console.error('전체 다운로드 실패:', error); utils.updateStatus(statusEl, `오류: ${error.message}`, 'error'); }
            finally { button.innerHTML = originalText; button.disabled = false; }
        }
    };
    app.init();
})();
