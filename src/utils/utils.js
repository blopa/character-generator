import { faker } from '@faker-js/faker';

export const getBase64 = (file) => new Promise((resolve, reject) => {
    let contents = '';
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.addEventListener('load', (e) => {
        contents = e.target.result;
        resolve(contents);
    });

    reader.onerror = (e) => {
        reject(e);
    };
});

export const generateNpcName = () => `npc-${faker.name.firstName().toLowerCase()}`;
