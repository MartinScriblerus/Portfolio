export const convertEnvSetting = (number: number) => {
    switch (number) {
        case 0: 
            return 'Blackman';
        case 1: 
            return 'BlackmanHarris';
        case 2: 
            return 'BlackmanNutall';
        case 3: 
            return 'Exponential';
        case 4: 
            return 'Hann';
        case 5: 
            return 'HannPoisson';
        case 6: 
            return 'Nutall';
        case 7: 
            return 'Parzen';
        case 8: 
            return 'Poisson';
        case 9: 
            return 'Sigmoid';
        case 10: 
            return 'Welch';
        case 11: 
            return 'Tukey';
    };
};
