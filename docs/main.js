import { price } from './data/price.js'; // named exportとしてインポート

document.addEventListener('DOMContentLoaded', () => {
    const formFields = document.getElementById('form-fields');
    const totalPriceElement = document.getElementById('total-price');
    const registerPriceElement = document.getElementById('register-price');
    const formControlElement = document.getElementById('form-control');

    // フォームのフィールドを生成
    Object.keys(price).forEach(category => {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);

        // 劣化パーツの場合は数量選択、それ以外はチェックボックス
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
    function applyDegradationPartsLimit(changedSelect) {
        const maxTotal = 5;
        const currentTotal = getDegradationPartsTotal();
        
        if (currentTotal > maxTotal) {
            // 制限を超えた場合、変更されたセレクトボックスを調整
            const changedValue = parseInt(changedSelect.value, 10);
            const otherTotal = currentTotal - changedValue;
            const maxAllowed = Math.max(0, maxTotal - otherTotal);
            
            // 選択肢を制限
            const options = changedSelect.querySelectorAll('option');
            options.forEach((option, index) => {
                const optionValue = parseInt(option.value, 10);
                if (optionValue > maxAllowed) {
                    option.disabled = true;
                } else {
                    option.disabled = false;
                }
            });
            
            // 現在の値が制限を超えている場合は調整
            if (changedValue > maxAllowed) {
                changedSelect.value = maxAllowed;
            }
        } else {
            // 制限内の場合、すべての選択肢を有効化
            const selects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
            selects.forEach(select => {
                const options = select.querySelectorAll('option');
                options.forEach(option => {
                    option.disabled = false;
                });
            });
        }
    }

    // 合計金額を計算
    formFields.addEventListener('change', (event) => {
        // 劣化パーツのセレクトボックスが変更された場合の制限適用
        if (event.target.tagName === 'SELECT' && event.target.getAttribute('data-category') === '劣化パーツ') {
            applyDegradationPartsLimit(event.target);
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

        // セレクトボックスをリセット
        const selects = formFields.querySelectorAll('select');
        selects.forEach(select => {
            select.value = '0';
            // 選択肢の制限も解除
            const options = select.querySelectorAll('option');
            options.forEach(option => {
                option.disabled = false;
            });
        });

        totalPriceElement.textContent = '0'; // 合計金額をリセット
        registerPriceElement.textContent = '0'; // 金庫金額をリセット
    });

    formControlElement.appendChild(resetButton); // ボタンをページに追加
    formControlElement.appendChild(submitButton); // ボタンをページに追加
});