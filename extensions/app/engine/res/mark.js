(() => {
    const folder = ['app', 'app-appinit', 'app-builtin', 'app-bundle', 'app-scene', 'app-sound', 'app-view', 'page', 'paper', 'pop', 'top'];
    function updateAssetMark(assetDock) {
        const assetItemList = assetDock.querySelectorAll('div.tree-node > ui-drag-item');
        if (!assetItemList) return;

        const finished = [];

        assetItemList.forEach((item) => {
            const currPaddingLeft = parseInt(item.style.paddingLeft);
            if (currPaddingLeft > 50) {
                item.style['border-left'] = '2px solid dimgray';
            } else {
                item.style['border-left'] = '';
            }

            const labelList = item.getElementsByTagName('label');
            if (!labelList) return;
            const labelEl = Array.from(labelList).find(labelEl => {
                labelEl.style.color = '';
                return folder.indexOf(labelEl.innerText.trim()) >= 0
            });
            if (!labelEl) return;

            const iconList = item.getElementsByTagName('ui-icon');
            if (!iconList || iconList.length < 2) return;
            const iconEl = Array.from(iconList).pop();
            if (!iconEl) return;
            iconEl.style.color = '';

            if (item.type !== 'cc.Asset') return;

            if (labelEl.innerText.trim() === 'app') {
                iconEl['value'] = 'setting';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'mediumturquoise';
                labelEl.style.color = 'whitesmoke';
            }
            else if (labelEl.innerText.trim() === 'app-appinit') {
                iconEl['value'] = 'home';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'sandybrown';
                labelEl.style.color = 'whitesmoke';
            }
            else if (labelEl.innerText.trim() === 'app-builtin') {
                iconEl['value'] = 'service';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'deepskyblue';
                labelEl.style.color = 'whitesmoke';
            }
            else if (labelEl.innerText.trim() === 'app-bundle') {
                iconEl['value'] = 'extension';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'mediumseagreen';
                labelEl.style.color = 'whitesmoke';
            }
            else if (labelEl.innerText.trim() === 'app-scene') {
                iconEl['value'] = 'mini-game';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'gold';
                labelEl.style.color = 'whitesmoke';
            }
            else if (labelEl.innerText.trim() === 'app-sound') {
                iconEl['value'] = 'music';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'yellowgreen';
                labelEl.style.color = 'yellowgreen';
            }
            else if (labelEl.innerText.trim() === 'app-view') {
                iconEl['value'] = 'particle';
                iconEl.removeAttribute('color');
                iconEl.style.color = 'tomato';
                labelEl.style.color = 'tomato';
            }
            else if (finished.indexOf(labelEl.innerText.trim()) === -1) {
                finished.push(labelEl.innerText.trim());
                iconEl.removeAttribute('color');
                iconEl.style.color = 'orange';
                labelEl.style.color = 'orange';
            }
        });
    }

    let retryCount = 0;
    const maxRetryCount = 10;

    function initAssetMark() {
        // 资源管理器窗口
        const assetDock = document.querySelector('#dock')?.shadowRoot?.
            querySelector('dock-layout dock-layout dock-groups dock-panels > panel-frame[name=assets]')?.shadowRoot?.
            querySelector('div > div.separate-box > div:nth-child(1) > section > ui-drag-area');

        if (!assetDock) {
            if (retryCount++ < maxRetryCount) {
                setTimeout(initAssetMark, 500);
            }
            return;
        }

        if (typeof MutationObserver === 'undefined') {
            setInterval(function () {
                updateAssetMark(assetDock);
            }, 50);
        } else {
            // 创建一个观察器实例并传入回调函数
            const observer = new MutationObserver(function () {
                updateAssetMark(assetDock);
            });

            // 开始观察已配置的目标节点（观察目标节点的子节点的变化）
            observer.observe(assetDock, { childList: true, subtree: true });

            // 你可以随时停止观察
            // observer.disconnect();
        }

        updateAssetMark(assetDock);
    }

    initAssetMark();
})();