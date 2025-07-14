import { price } from './data/price.js'; // named exportとしてインポート
import { materials } from './data/material.js'; // 必要素材データをインポート

document.addEventListener('DOMContentLoaded', () => {
    const formFields = document.getElementById('form-fields');
    const totalPriceElement = document.getElementById('total-price');
    const registerPriceElement = document.getElementById('register-price');
    const formControlElement = document.getElementById('form-control');

    // 必要素材表示用の要素を作成
    const materialSummaryDiv = document.createElement('div');
    materialSummaryDiv.id = 'material-summary';
    materialSummaryDiv.className = 'material-summary';

    // 単一選択のカテゴリ（price.jsのキー名に合わせて）
    const singleSelectCategories = ['エンジン', 'サスペンション', 'トランスミッション', 'ブレーキ'];

    // --- カテゴリごとのフォーム生成関数 ---
    function renderSingleSelectCategory(category, price, formFields) {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);
        Object.keys(price[category]).forEach(level => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = category;
            checkbox.value = price[category][level];
            checkbox.setAttribute('data-category', category);
            checkbox.setAttribute('data-level', level);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${level} (${price[category][level].toLocaleString()}円)`));
            fieldset.appendChild(label);
        });
        formFields.appendChild(fieldset);
    }
    function renderDegradationPartsCategory(category, price, formFields) {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);
        Object.keys(price[category]).forEach(subCategory => {
            const label = document.createElement('label');
            label.className = 'degradation-flex-label';
            const subLegend = document.createElement('span');
            subLegend.textContent = subCategory;
            subLegend.className = 'degradation-subcategory';
            const select = document.createElement('select');
            select.setAttribute('data-category', category);
            select.setAttribute('data-subcategory', subCategory);
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '選択なし';
            select.appendChild(emptyOption);
            Object.keys(price[category][subCategory]).forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = `${level} (${price[category][subCategory][level].toLocaleString()}円)`;
                select.appendChild(option);
            });
            label.appendChild(subLegend);
            label.appendChild(select);
            fieldset.appendChild(label);
        });
        formFields.appendChild(fieldset);
    }
    function renderOtherCategory(category, price, formFields) {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);
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
        formFields.appendChild(fieldset);
    }

    // --- フォーム生成本体 ---
    Object.keys(price).forEach(category => {
        if (singleSelectCategories.includes(category)) {
            renderSingleSelectCategory(category, price, formFields);
        } else if (category === '劣化パーツ') {
            renderDegradationPartsCategory(category, price, formFields);
        } else {
            renderOtherCategory(category, price, formFields);
        }
    });

    // 必要素材を集計して表示する関数
    function updateMaterialSummary() {
        const materialCount = {};
        // 単一選択カテゴリ
        singleSelectCategories.forEach(category => {
            const checked = formFields.querySelector(`input[type="checkbox"][data-category="${category}"]:checked`);
            if (checked && materials[category]) {
                const level = checked.getAttribute('data-level');
                const mat = materials[category][level];
                if (mat) {
                    Object.entries(mat).forEach(([name, count]) => {
                        materialCount[name] = (materialCount[name] || 0) + count;
                    });
                }
            }
        });
        // 劣化パーツ
        const selects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        selects.forEach(select => {
            const subCategory = select.getAttribute('data-subcategory');
            const level = select.value;
            if (level && materials['劣化パーツ'] && materials['劣化パーツ'][subCategory] && materials['劣化パーツ'][subCategory][level]) {
                const mat = materials['劣化パーツ'][subCategory][level];
                Object.entries(mat).forEach(([name, count]) => {
                    materialCount[name] = (materialCount[name] || 0) + count;
                });
            }
        });
        // その他カテゴリ
        Object.keys(materials).forEach(category => {
            if (!singleSelectCategories.includes(category) && category !== '劣化パーツ') {
                const checkboxes = formFields.querySelectorAll(`input[type="checkbox"][data-category="${category}"]:checked`);
                checkboxes.forEach(checkbox => {
                    const level = checkbox.getAttribute('data-level');
                    const mat = materials[category][level];
                    if (mat) {
                        Object.entries(mat).forEach(([name, count]) => {
                            materialCount[name] = (materialCount[name] || 0) + count;
                        });
                    }
                });
            }
        });
        let html = '<b>必要な素材一覧</b><ul class="material-summary-list">';
        if (Object.keys(materialCount).length === 0) {
            html += '<li class="material-summary-item">（選択項目なし）</li>';
        } else {
            Object.entries(materialCount).forEach(([name, count]) => {
                html += `<li class="material-summary-item">${name}: ${count}</li>`;
            });
        }
        html += '</ul>';
        materialSummaryDiv.innerHTML = html;
    }

    // 合計金額を計算
    formFields.addEventListener('change', (event) => {
        let total = 0; // 合計金額を初期化

        // 劣化パーツのチェックボックスの合計を計算
        const degradationCheckboxes = formFields.querySelectorAll('input[type="checkbox"][data-category="劣化パーツ"]:checked');
        degradationCheckboxes.forEach(checkbox => {
            const value = parseInt(checkbox.value, 10);
            if (!isNaN(value)) {
                total += value;
            }
        });

        // 単一選択カテゴリのチェックボックスは1カテゴリにつき1つだけ選択可にする
        if (event.target.type === 'checkbox' && singleSelectCategories.includes(event.target.getAttribute('data-category'))) {
            const category = event.target.getAttribute('data-category');
            if (event.target.checked) {
                // 同じカテゴリの他のチェックを外す
                const checkboxes = formFields.querySelectorAll(`input[type="checkbox"][data-category="${category}"]`);
                checkboxes.forEach(cb => {
                    if (cb !== event.target) cb.checked = false;
                });
            }
        }

        // 単一選択カテゴリ（エンジン等）のチェックボックスの合計を計算
        singleSelectCategories.forEach(category => {
            const checked = formFields.querySelector(`input[type="checkbox"][data-category="${category}"]:checked`);
            if (checked) {
                const value = parseInt(checked.value, 10);
                if (!isNaN(value)) {
                    total += value;
                }
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

        // 劣化パーツのセレクトの合計を計算
        const degradationSelects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        degradationSelects.forEach(select => {
            const subCategory = select.getAttribute('data-subcategory');
            const level = select.value;
            if (level && price['劣化パーツ'] && price['劣化パーツ'][subCategory] && price['劣化パーツ'][subCategory][level]) {
                const value = parseInt(price['劣化パーツ'][subCategory][level], 10);
                if (!isNaN(value)) {
                    total += value;
                }
            }
        });

        // その他カテゴリ（単一選択・劣化パーツ以外）のチェックボックスの合計を計算
        Object.keys(price).forEach(category => {
            if (!singleSelectCategories.includes(category) && category !== '劣化パーツ') {
                const checkboxes = formFields.querySelectorAll(`input[type="checkbox"][data-category="${category}"]:checked`);
                checkboxes.forEach(checkbox => {
                    const value = parseInt(checkbox.value, 10);
                    if (!isNaN(value)) {
                        total += value;
                    }
                });
            }
        });

        // 合計金額を表示
        if (window.totalPriceElement) window.totalPriceElement.textContent = total.toLocaleString();
        if (window.registerPriceElement) window.registerPriceElement.textContent = (total*0.3).toLocaleString();

        // 必要素材集計も更新
        updateMaterialSummary();
    });

    // 初期化時に制限を適用
    // 劣化パーツの合計個数取得・制限関数、applyDegradationPartsLimit()などは不要なので削除

    // ラジオボタンの再クリックで解除できるようにする
    let _radioWasChecked = false;
    let _radioTarget = null;
    formFields.addEventListener('mousedown', function(event) {
        let radio = null;
        if (event.target.type === 'radio') {
            radio = event.target;
        } else if (event.target.tagName === 'LABEL') {
            // label直下のinput[type=radio]またはfor属性
            radio = event.target.querySelector('input[type="radio"]');
            if (!radio && event.target.htmlFor) {
                radio = document.getElementById(event.target.htmlFor);
            }
        }
        if (radio) {
            _radioWasChecked = radio.checked;
            _radioTarget = radio;
        } else {
            _radioWasChecked = false;
            _radioTarget = null;
        }
    }, true); // キャプチャ段階
    formFields.addEventListener('click', function(event) {
        let radio = null;
        if (event.target.type === 'radio') {
            radio = event.target;
        } else if (event.target.tagName === 'LABEL') {
            radio = event.target.querySelector('input[type="radio"]');
            if (!radio && event.target.htmlFor) {
                radio = document.getElementById(event.target.htmlFor);
            }
        }
        if (radio && _radioWasChecked) {
            radio.checked = false;
            formFields.dispatchEvent(new Event('change', {bubbles:true}));
        }
        _radioWasChecked = false;
        _radioTarget = null;
    }, true); // キャプチャ段階

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
        const degradationSelects = formFields.querySelectorAll('select[data-category="劣化パーツ"]');
        degradationSelects.forEach(select => {
            const subCategory = select.getAttribute('data-subcategory');
            const level = select.value;
            if (level) {
                selectedItems.push(`劣化パーツ (${subCategory} ${level})`);
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
            if (select.getAttribute('data-category') === '劣化パーツ') {
                select.value = '';
            } else {
                select.value = '0';
            }
        });

        if (window.totalPriceElement) window.totalPriceElement.textContent = '0'; // 合計金額をリセット
        if (window.registerPriceElement) window.registerPriceElement.textContent = '0'; // 金庫金額をリセット
        // 劣化パーツの合計個数取得・制限関数、applyDegradationPartsLimit()などは不要なので削除
        updateMaterialSummary(); // リセット時も素材集計をリセット
    });

    formControlElement.appendChild(resetButton); // ボタンをページに追加
    
    // 合計金額表示のp要素を取得
    const totalPriceP = totalPriceElement.closest('p');

    // URLに特定の文字列が含まれる場合のみ金庫金額も表示
    const currentURL = window.location.href;
    if (currentURL.includes('employee')) {
        // 合計金額表示の上にmaterialSummaryDivを挿入
        if (totalPriceP) {
            totalPriceP.parentNode.insertBefore(materialSummaryDiv, totalPriceP);
            // 金庫金額も表示
            totalPriceP.innerHTML = '合計金額: <span id="total-price">0</span>円 / 金庫金額: <span id="register-price">0</span>円';
            // spanを書き換えたので再取得
            window.totalPriceElement = document.getElementById('total-price');
            window.registerPriceElement = document.getElementById('register-price');
        }
        updateMaterialSummary(); // 初期表示
        formControlElement.appendChild(submitButton); // ボタンをページに追加
    } else {
        // employeeでなければ金庫金額を非表示
        if (totalPriceP) {
            totalPriceP.innerHTML = '合計金額: <span id="total-price">0</span>円';
            // spanを書き換えたので再取得
            window.totalPriceElement = document.getElementById('total-price');
            window.registerPriceElement = null;
        }
    }
});