/*
* Power BI Visualizations
*
* Copyright (c) Microsoft Corporation
* All rights reserved.
* MIT License
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the ""Software""), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Chat Settings Card
 */
class ChatSettingsCard extends FormattingSettingsCard {
    directLineSecret = new formattingSettings.TextInput({
        name: "directLineSecret",
        displayName: "URL da Função Netlify",
        placeholder: "Cole a URL aqui",
        value: ""
    });

    name: string = "chatSettings";
    displayName: string = "🤖 Configurações da Ponte";
    slices: Array<FormattingSettingsSlice> = [this.directLineSecret];
}

/**
* Visual settings model class
*
*/
export class VisualSettings extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    chatSettings = new ChatSettingsCard();
    cards = [this.chatSettings];
}
