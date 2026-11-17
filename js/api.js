import { request } from './backoffice/services/apiClient.js';

// L'adresse de base de l'API des cours (xaus.com)
const XAUS_URL = 'https://xaus.com/api/v1';

// Prix actuels, par gramme, dans la devise choisie
export function fetchGoldPrices(currency = 'MAD') {
    return request(XAUS_URL + '/spot?currency=' + currency + '&unit=gram');
}

// Prix des derniers jours d'un métal : 'xau' = or, 'silver' = argent
export function fetchChart(symbol) {
    return request(XAUS_URL + '/chart?symbol=' + symbol + '&range=1mo&interval=1d');
}