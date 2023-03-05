import { useState, useMemo, useEffect, useRef, useCallback, Fragment } from 'react';
import Dropzone from './components/DropZone';

// Utils
import { getBase64 } from './utils/utils';

// Constants
const MAX_NAME_SIZE = 20;

function App() {
    const [currFrame, setCurrFrame] = useState(0);
    const [fps, setFps] = useState(3);
    const [scale, setScale] = useState(3);
    const [spriteWidth, setSpriteWidth] = useState(20);
    const [spriteHeight, setSpriteHeight] = useState(20);
    const [spriteWidthQty, setSpriteWidthQty] = useState(1);
    const [spriteHeightQty, setSpriteHeightQty] = useState(1);
    const [spriteName, setSpriteName] = useState('sample');
    const [spriteFiles, setSpriteFiles] = useState([]);
    const [canvasSize, setCanvasSize] = useState([null, null]);
    const [gridSize, setGridSize] = useState([null, null]);
    const [imageSize, setImageSize] = useState([null, null]);
    const [order, setOrder] = useState('columns');
    const [spritesCategories, setSpritesCategories] = useState([
        { name: 'base', canDisable: false },
        { name: 'torsos' },
        { name: 'feet' },
        { name: 'hands' },
        { name: 'heads' },
        { name: 'eyes' },
        { name: 'tools' },
        { name: 'hairs', randomizerNullable: true },
        { name: 'hats', randomizerNullable: true },
    ]);
    const [category, setCategory] = useState(spritesCategories[0]);
    const canvas = useRef(null);
    const [columns, rows] = gridSize;

    const spritesOrder = useMemo(() => {
        const result = [];
        const isColumns = order === 'columns';
        (new Array(isColumns ? columns : rows)).fill(null).forEach((v1, row) => {
            const cols = [];
            (new Array(isColumns ? rows : columns)).fill(null).forEach((v2, column) => {
                cols.push(isColumns ? [-row, -column] : [-column, -row]);
            });

            result.push(...cols);
            // TODO redo this spritesOrder logic
            // add checkbox to make it reverse or not
            // cols.pop();
            // result.push(...cols.reverse());
        });

        return result;
    }, [columns, rows, order]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currFrame >= spritesOrder.length - 1) {
                setCurrFrame(0);
            } else {
                setCurrFrame(currFrame + 1);
            }
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [currFrame, fps, spritesOrder.length]);

    const changeSpritePosition = useCallback((from, to) => {
        if (to > spriteFiles.length - 1 || to < 0) {
            return;
        }

        const newSpriteFiles = [...spriteFiles];
        const f = newSpriteFiles.splice(from, 1)[0];
        newSpriteFiles.splice(to, 0, f);
        setSpriteFiles(newSpriteFiles);
    }, [spriteFiles]);

    const removeSprite = useCallback((index) => {
        setSpriteFiles(spriteFiles.filter((val, idx) => idx !== index));
    }, [spriteFiles]);

    const handleOrderChange = useCallback((e) => {
        setOrder(e.target.value);
    }, [setOrder]);

    const randomize = useCallback(() => {
        const newSprites = [...spriteFiles];
        spritesCategories.forEach(({ name: cat, randomizerNullable }) => {
            const categorySprites = newSprites.filter((sprite) => sprite.category === cat);
            const random =
                Math.floor(Math.random() * categorySprites.length)
                - (randomizerNullable ? Math.round(Math.random()) : 0);

            categorySprites.forEach((sprite, index) => {
                // eslint-disable-next-line no-param-reassign
                sprite.show = index === random;
            });
        });

        setSpriteFiles([...newSprites]);
    }, [spriteFiles, spritesCategories]);

    const mergeImages = useCallback(() => {
        const ctx = canvas.current.getContext('2d');
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

        const filteredSprites = spriteFiles.filter(({ show }) => show);
        filteredSprites.forEach(({ image }, index) => {
            const htmlImage = new Image();
            htmlImage.addEventListener('load', () => {
                ctx.drawImage(htmlImage, 0, 0);
                if (index + 1 >= filteredSprites.length) {
                    const aDownloadLink = document.createElement('a');
                    aDownloadLink.download = `${spriteName || 'sample'}.png`;
                    aDownloadLink.href = canvas.current.toDataURL('image/png');
                    aDownloadLink.click();
                }
            });
            htmlImage.src = image;
        });
    }, [spriteFiles, spriteName]);

    const [width, height] = canvasSize;
    useEffect(() => {
        if (canvas.current) {
            const ctx = canvas.current.getContext('2d');
            ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

            const filteredSprites = spriteFiles.filter(({ show }) => show);
            filteredSprites.forEach(({ image }) => {
                const htmlImage = new Image();
                htmlImage.addEventListener('load', () => {
                    ctx.drawImage(htmlImage, 0, 0);
                    if (canvas.current && !width && !height) {
                        setCanvasSize([
                            htmlImage.width,
                            htmlImage.height,
                        ]);

                        setGridSize([
                            // row
                            htmlImage.width,
                            // column
                            htmlImage.height,
                        ]);

                        setImageSize([
                            // row
                            htmlImage.width,
                            // column
                            htmlImage.height,
                        ]);
                        setSpriteHeight(htmlImage.height);
                        setSpriteWidth(htmlImage.width);
                    }
                });
                htmlImage.src = image;
            });
        }
    }, [canvasSize, height, spriteFiles, width, spriteWidth, spriteHeight]);

    useEffect(() => {
        const [width, height] = imageSize;

        if (width && height) {
            setGridSize([
                // row
                Math.ceil(width / spriteWidth),
                // column
                Math.ceil(height / spriteHeight),
            ]);
        }
    }, [setGridSize, spriteWidth, spriteHeight, imageSize]);

    const [x, y] = spritesOrder?.[currFrame] || [];
    const containsSprites = spriteFiles.length > 0;

    const handleOnDrop = useCallback(async (acceptedFiles) => {
        const newSprites = [...spriteFiles];
        // eslint-disable-next-line no-restricted-syntax
        for (const acceptedFile of acceptedFiles) {
            newSprites.push({
                name: acceptedFile.name,
                // eslint-disable-next-line no-await-in-loop
                image: await getBase64(acceptedFile),
                show: true,
                category: category.name,
            });
        }

        setSpriteFiles(newSprites);
    }, [spriteFiles, category.name]);

    return (
        <div>
            <label>Sprite Type: </label>
            <select
                value={category.name}
                onChange={(e) => {
                    const cat = spritesCategories.find(({ name }) => name === e.target.value);
                    setCategory(cat);
                }}
            >
                {spritesCategories.map(({ name: cat }) => (
                    <option
                        key={cat}
                        value={cat}
                    >
                        {cat}
                    </option>
                ))}
            </select>
            <Dropzone onDrop={handleOnDrop} />
            {containsSprites && (
                <Fragment>
                    <hr />
                    <div>
                        <div>
                            <label htmlFor="fps">Order:</label>
                            <select onChange={handleOrderChange}>
                                <option value="columns">Columns - Rows</option>
                                <option value="rows">Rows - Columns</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="fps">FPS:</label>
                            <input
                                id="fps"
                                name="fps"
                                type="number"
                                min="1"
                                value={fps}
                                onChange={(e) => setFps(Number.parseInt(e.target.value, 10))}
                            />
                            <label htmlFor="scale">Scale:</label>
                            <input
                                id="scale"
                                name="scale"
                                type="number"
                                min="1"
                                value={scale}
                                onChange={(e) => setScale(Number.parseInt(e.target.value, 10))}
                            />
                        </div>
                        <div>
                            <label htmlFor="spriteWidth">Sprite Width:</label>
                            <input
                                id="spriteWidth"
                                name="spriteWidth"
                                type="number"
                                min="1"
                                value={spriteWidth}
                                onChange={(e) => {
                                    const [width, height] = imageSize;
                                    const val = Number.parseInt(e.target.value, 10);
                                    setSpriteWidthQty(width / val);
                                    setSpriteWidth(val);
                                }}
                            />
                            <label htmlFor="spriteHeight">Sprite Height:</label>
                            <input
                                id="spriteHeight"
                                name="spriteHeight"
                                type="number"
                                min="1"
                                value={spriteHeight}
                                onChange={(e) => {
                                    const [width, height] = imageSize;
                                    const val = Number.parseInt(e.target.value, 10);
                                    setSpriteHeightQty(height / val);
                                    setSpriteHeight(val);
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="spriteWidthQty">Sprite Width Qty:</label>
                            <input
                                id="spriteWidthQty"
                                name="spriteWidthQty"
                                type="number"
                                min="1"
                                value={spriteWidthQty}
                                onChange={(e) => {
                                    const [width, height] = imageSize;
                                    const val = Number.parseInt(e.target.value, 10);
                                    setSpriteWidth(width / val);
                                    setSpriteWidthQty(val);
                                }}
                            />
                            <label htmlFor="spriteHeightQty">Sprite Height Qty:</label>
                            <input
                                id="spriteHeightQty"
                                name="spriteHeightQty"
                                type="number"
                                min="1"
                                value={spriteHeightQty}
                                onChange={(e) => {
                                    const [width, height] = imageSize;
                                    const val = Number.parseInt(e.target.value, 10);
                                    setSpriteHeight(height / val);
                                    setSpriteHeightQty(val);
                                }}
                            />
                        </div>
                    </div>
                    <hr />
                    {spriteFiles.map(({ image, name, show, category: cat }, index) => (
                        <div key={name}>
                            <input
                                id={`check-${name}`}
                                type="checkbox"
                                checked={show}
                                onChange={() => {
                                    const newSpriteFiles = [...spriteFiles];
                                    newSpriteFiles[index] = {
                                        ...newSpriteFiles[index],
                                        show: !show,
                                    };

                                    setSpriteFiles(newSpriteFiles);
                                }}
                            />
                            <label htmlFor={`check-${name}`}>
                                {name.length > MAX_NAME_SIZE ? `${name.substring(0, MAX_NAME_SIZE)}...` : name} - {cat} {' '}
                            </label>
                            <button
                                onClick={() => changeSpritePosition(index, index - 1)}
                                type="button"
                            >
                                ⬆️
                            </button>
                            <button
                                onClick={() => changeSpritePosition(index, index + 1)}
                                type="button"
                            >
                                ⬇️️
                            </button>
                            <button
                                onClick={() => removeSprite(index, name)}
                                type="button"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                    <hr />
                    <label htmlFor="spriteName">Sprite Name:</label>
                    <input
                        id="spriteName"
                        name="spriteName"
                        type="spriteName"
                        value={spriteName}
                        onChange={(e) => setSpriteName(e.target.value)}
                    />
                    <button onClick={mergeImages} type="button">
                        Save
                    </button>
                    <button onClick={randomize} type="button">
                        Randomize
                    </button>
                    <hr />
                    <div>
                        {spriteFiles.map(({ image, name, show }) => {
                            if (!show) {
                                return null;
                            }

                            return (
                                <div
                                    key={name}
                                    style={{
                                        imageRendering: 'pixelated',
                                        overflow: 'hidden',
                                        backgroundRepeat: 'no-repeat',
                                        display: 'table-cell',
                                        backgroundImage: `url(${image})`,
                                        width: `${spriteWidth}px`,
                                        height: `${spriteHeight}px`,
                                        transformOrigin: '0px 50%',
                                        backgroundPosition: `${x * spriteWidth}px ${y * spriteHeight}px`,
                                        zoom: scale,
                                        position: 'absolute',
                                    }}
                                />
                            );
                        })}
                    </div>
                    <canvas
                        ref={canvas}
                        width={width}
                        height={height}
                        style={{
                            zoom: scale,
                            float: 'right',
                            marginRight: '20px',
                            imageRendering: 'pixelated',
                            display: 'none',
                        }}
                    />
                </Fragment>
            )}
        </div>
    );
}

export default App;
