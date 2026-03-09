import { XMLBuilder } from 'fast-xml-parser';

export const xmlBuilder = (data) => {
  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
  });

  const xmlObject = {
    HouseList: {
      House: data.map((house) => ({
        ...house,
        pricePerArea: (Number(house.price) / Number(house.area)).toFixed(2),
      })),
    },
  };

  return builder.build(xmlObject);
};
