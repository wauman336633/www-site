import { price } from './data/price.js'; // named exportとしてインポート

document.addEventListener('DOMContentLoaded', () => {
    const formFields = document.getElementById('form-fields');
    const totalPriceElement = document.getElementById('total-price');
    const registerPriceElement = document.getElementById('register-price');
    const formControlElement = document.getElementById('form-control');

    // 単一選択のカテゴリ
    const singleSelectCategories = ['エンジン', 'サスペンション', 'トランスミッション', 'ブレーキ'];

    // フォームのフィールドを生成
    Object.keys(price).forEach(category => {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);

        // 劣化パーツの場合は数量選択、単一選択カテゴリはラジオボタン、その他はチェックボックス
        if (category === '劣化パーツ') {
            // 劣化パーツの場合は数量選択セレクトボックス
            Object.keys(price[category]).forEach(level => {
                const label = document.createElement('label');
                const select = document.createElement('select');
                select.setAttribute('data-category', category);
                select.setAttribute('data-level', level);
                select.setAttribute('data-price', price[category][level]);

                // 0個から5個までの選択肢を追加
                for (let i = 0; i <= 5; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = i === 0 ? '0個' : `${i}個`;
                    select.appendChild(option);
                }

                label.appendChild(select);
                label.appendChild(document.createTextNode(` ${level} (${price[category][level].toLocaleString()}円/個)`));
                fieldset.appendChild(label);
            });
            
            // 残り個数表示用の要素を追加
            const remainingDiv = document.createElement('div');
            remainingDiv.id = 'remaining-parts';
            remainingDiv.style.cssText = 'margin-top: 5px; font-size: 0.9em; color: #333;';
            remainingDiv.textContent = '残り選択可能個数: 5個';
            fieldset.appendChild(remainingDiv);
        } else if (singleSelectCategories.includes(category)) {
            // 単一選択カテゴリはラジオボタン
            Object.keys(price[category]).forEach(level => {
                const label = document.createElement('label');
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = category; // 同じカテゴリ内で同じname属性
                radio.value = price[category][level];
                radio.setAttribute('data-category', category);
                radio.setAttribute('data-level', level);

                label.appendChild(radio);
                label.appendChild(document.createTextNode(` ${level} (${price[category][level].toLocaleString()}円)`));
                fieldset.appendChild(label);
            });
        } else {
            // その他のカテゴリはチェックボックス
            Object.keys(price[category]).forEach(level => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = price[category][level];
                checkbox.setAttribute('data-category', category);
                checkbox.setAttribute('data-level', level);

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${level} (${price[category][level].toLocaleString()}円)`));
                fieldset.appendChild(label);
            });
        }

        formFields.appendChild(fieldset);
    });

    // 劣化パーツの合計個数を取得する関数
    function getDegradationPartsTotal() {
        const selects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        let total = 0;
        selects.forEach(select => {
            total += parseInt(select.value, 10);
        });
        return total;
    }

    // 劣化パーツの選択制限を適用する関数
    function applyDegradationPartsLimit() {
        const maxTotal = 5;
        const currentTotal = getDegradationPartsTotal();
        const remaining = maxTotal - currentTotal;
        
        // 残り個数を表示
        const remainingDiv = document.getElementById('remaining-parts');
        if (remainingDiv) {
            remainingDiv.textContent = `残り選択可能個数: ${remaining}個`;
            if (remaining === 0) {
                remainingDiv.style.color = '#d32f2f';
                remainingDiv.style.fontWeight = 'bold';
            } else {
                remainingDiv.style.color = '#333';
                remainingDiv.style.fontWeight = 'normal';
            }
        }
        
        // 各セレクトボックスの選択肢を制限
        const selects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        selects.forEach(select => {
            const currentValue = parseInt(select.value, 10);
            const options = select.querySelectorAll('option');
            
            options.forEach(option => {
                const optionValue = parseInt(option.value, 10);
                const otherTotal = currentTotal - currentValue;
                const maxAllowed = Math.max(0, maxTotal - otherTotal);
                
                if (optionValue > maxAllowed) {
                    option.disabled = true;
                } else {
                    option.disabled = false;
                }
            });
            
            // 現在の値が制限を超えている場合は調整
            const otherTotal = currentTotal - currentValue;
            const maxAllowed = Math.max(0, maxTotal - otherTotal);
            if (currentValue > maxAllowed) {
                select.value = maxAllowed;
            }
        });
    }

    // 合計金額を計算
    formFields.addEventListener('change', (event) => {
        // 劣化パーツのセレクトボックスが変更された場合の制限適用
        if (event.target.tagName === 'SELECT' && event.target.getAttribute('data-category') === '劣化パーツ') {
            applyDegradationPartsLimit();
        }

        let total = 0;
        
        // チェックボックスの合計を計算
        const checkboxes = formFields.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const value = parseInt(checkbox.value, 10);
            if (!isNaN(value)) {
                total += value;
            }
        });

        // ラジオボタンの合計を計算
        const radios = formFields.querySelectorAll('input[type="radio"]:checked');
        radios.forEach(radio => {
            const value = parseInt(radio.value, 10);
            if (!isNaN(value)) {
                total += value;
            }
        });

        // 劣化パーツのセレクトボックスの合計を計算
        const selects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        selects.forEach(select => {
            const quantity = parseInt(select.value, 10);
            const price = parseInt(select.getAttribute('data-price'), 10);
            if (!isNaN(quantity) && !isNaN(price)) {
                total += quantity * price;
            }
        });

        // 合計金額を表示
        totalPriceElement.textContent = total.toLocaleString();
        registerPriceElement.textContent = (total*0.3).toLocaleString();
    });

    // 初期化時に制限を適用
    applyDegradationPartsLimit();

    // Submitボタンを追加
    const submitButton = document.createElement('button');
    submitButton.textContent = '収支報告フォームに送信';
    submitButton.type = 'button';
    submitButton.addEventListener('click', () => {
        const selectedItems = [];

        // チェックボックスの選択項目を取得
        const checkboxes = formFields.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const category = checkbox.getAttribute('data-category');
            const level = checkbox.getAttribute('data-level');
            selectedItems.push(`${category} (${level})`);
        });

        // ラジオボタンの選択項目を取得
        const radios = formFields.querySelectorAll('input[type="radio"]:checked');
        radios.forEach(radio => {
            const category = radio.getAttribute('data-category');
            const level = radio.getAttribute('data-level');
            selectedItems.push(`${category} (${level})`);
        });

        // 劣化パーツの選択項目を取得
        const selects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        selects.forEach(select => {
            const level = select.getAttribute('data-level');
            const quantity = parseInt(select.value, 10);
            if (quantity > 0) {
                selectedItems.push(`劣化パーツ (${level} × ${quantity}個)`);
            }
        });

        const selectedItemsText = selectedItems.join(', ');
        const total = totalPriceElement.textContent.replace(/,/g, ''); // 合計金額を取得
        const googleFormURL = `https://docs.google.com/forms/d/e/1FAIpQLScoaUD7j_OMxA62nRL27xQQ0xtAASm9200pPOmJSJttPOMl8w/viewform?usp=pp_url&entry.62649312=性能カスタム（収入）&entry.56986843=${total*0.3}&entry.367017110=${encodeURIComponent(selectedItemsText)}`;

        window.open(googleFormURL, '_blank'); // Googleフォームを新しいタブで開く
    });

    // リセットボタンを追加
    const resetButton = document.createElement('button');
    resetButton.textContent = 'リセット';
    resetButton.type = 'button';
    resetButton.addEventListener('click', () => {
        // チェックボックスをリセット
        const checkboxes = formFields.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // ラジオボタンをリセット
        const radios = formFields.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.checked = false;
        });

        // セレクトボックスをリセット
        const selects = formFields.querySelectorAll('select');
        selects.forEach(select => {
            select.value = '0';
        });

        totalPriceElement.textContent = '0'; // 合計金額をリセット
        registerPriceElement.textContent = '0'; // 金庫金額をリセット
        applyDegradationPartsLimit(); // リセット時も制限を適用
    });

    formControlElement.appendChild(resetButton); // ボタンをページに追加
    
    // URLに特定の文字列が含まれる場合のみSubmitボタンを表示
    const currentURL = window.location.href;
    if (currentURL.includes('employee')) {
        formControlElement.appendChild(submitButton); // ボタンをページに追加
    }
});