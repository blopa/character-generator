import {Fragment, useCallback, useEffect, useState} from "react";
import Dropzone from 'react-dropzone'

const spritesOrder = [
    // walking down
    [-1, 0],
    [-2, 0],
    [-1, 0],
    [0, 0],
    [-1, 0],

    // walking right
    [-1, -2],
    [-2, -2],
    [-1, -2],
    [0, -2],
    [-1, -2],

    // walking up
    [-1, -3],
    [-2, -3],
    [-1, -3],
    [0, -3],
    [-1, -3],

    // walking left
    [-1, -1],
    [-2, -1],
    [-1, -1],
    [0, -1],
    [-1, -1],
];

function getBase64(file) {
    return new Promise((resolve, reject) => {
        let contents = ""
        const reader = new FileReader()
        reader.readAsDataURL(file);

        reader.onload = function (e) {
            contents = e.target.result
            resolve(contents)
        }

        reader.onerror = function (e) {
            reject(e)
        }
    })
}

function App() {
    const [currFrame, setCurrFrame] = useState(0);
    const [fps, setFps] = useState(3);
    const [scale, setScale] = useState(3);
    const [spriteSize, setSpriteSize] = useState(20);
    const [spriteName, setSpriteName] = useState('sample');
    const [spriteFiles, setSpriteFiles] = useState([]);
    const [spritesCategories, setSpritesCategories] = useState(['torsos', 'feet', 'hands', 'heads', 'eyes', 'hairs']);
    const [category, setCategory] = useState(spritesCategories[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currFrame >= spritesOrder.length - 1) {
                setCurrFrame(0);
            } else {
                setCurrFrame(currFrame + 1);
            }
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [currFrame, fps]);

    const changeSpritePosition = useCallback((from, to) => {
        if (to > spriteFiles.length - 1 || to < 0) {
            return;
        }

        const newSpriteFiles = [...spriteFiles];
        const f = newSpriteFiles.splice(from, 1)[0];
        newSpriteFiles.splice(to, 0, f);
        setSpriteFiles(newSpriteFiles);
    }, [spriteFiles]);

    const randomize = useCallback(() => {
        const newSprites = [...spriteFiles];
        spritesCategories.forEach((cat) => {
            const categorySprites = newSprites.filter((sprite) => sprite.category === cat);
            const random = Math.floor(Math.random() * categorySprites.length);
            categorySprites.forEach((sprite, index) => {
                sprite.show = index === random;
            });
        });

        setSpriteFiles(newSprites);
    }, [spriteFiles, spritesCategories]);

    const mergeImages = useCallback(() => {
        const canvas = document.createElement('canvas');
        canvas.width = spriteSize * 3;
        canvas.height = spriteSize * 3;
        const ctx = canvas.getContext("2d");

        const filteredSprites = spriteFiles.filter(({show}) => show);
        filteredSprites.forEach(({ image }, index) => {
                const htmlImage = new Image();
                htmlImage.onload = function () {
                    ctx.drawImage(htmlImage, 0, 0);
                    if (index + 1 >= filteredSprites.length) {
                        const aDownloadLink = document.createElement('a');
                        aDownloadLink.download = `${spriteName || 'sample'}.png`;
                        aDownloadLink.href = canvas.toDataURL('image/png');
                        aDownloadLink.click();
                    }
                };
                htmlImage.src = image;
            });

    }, [spriteFiles, spriteName, spriteSize]);

    const [x, y] = spritesOrder[currFrame];
    const containsSprites = spriteFiles.length > 0;

    return (
        <div>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                {spritesCategories.map((cat) => {
                    return (
                        <option
                            key={cat}
                            value={cat}
                        >
                            {cat}
                        </option>
                    );
                })}
            </select>
            <Dropzone
                onDrop={async acceptedFiles => {
                    const newSprites = [...spriteFiles];
                    for (const acceptedFile of acceptedFiles) {
                        newSprites.push({
                            name: acceptedFile.name,
                            image: await getBase64(acceptedFile),
                            show: true,
                            category,
                        });
                    }
                    setSpriteFiles(newSprites);
                }}
            >
                {({getRootProps, getInputProps}) => (
                    <section>
                        <div {...getRootProps({
                            style: {
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '20px',
                                borderWidth: 2,
                                borderRadius: 2,
                                borderColor: '#eeeeee',
                                borderStyle: 'dashed',
                                backgroundColor: '#fafafa',
                                color: '#bdbdbd',
                                outline: 'none',
                                transition: 'border .24s ease-in-out'
                            }
                        })}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here, or click to select files</p>
                        </div>
                    </section>
                )}
            </Dropzone>
            {containsSprites && (
                <Fragment>
                    <hr/>
                    <div>
                        <label htmlFor={'fps'}>FPS:</label>
                        <input
                            id={'fps'}
                            name={'fps'}
                            type={'number'}
                            value={fps}
                            onChange={(e) => setFps(parseInt(e.target.value, 10))}
                        />
                        <label htmlFor={'scale'}>Scale:</label>
                        <input
                            id={'scale'}
                            name={'scale'}
                            type={'number'}
                            value={scale}
                            onChange={(e) => setScale(parseInt(e.target.value, 10))}
                        />
                        <label htmlFor={'spriteSize'}>Sprite Size:</label>
                        <input
                            id={'spriteSize'}
                            name={'spriteSize'}
                            type={'number'}
                            value={spriteSize}
                            onChange={(e) => setSpriteSize(parseInt(e.target.value, 10))}
                        />
                    </div>
                    <hr/>
                    {spriteFiles.map(({ image, name, show, category: cat }, index) => {
                        return (
                            <div key={name}>
                                <input
                                    id={`check-${name}`}
                                    type={"checkbox"}
                                    checked={show}
                                    onChange={() => {
                                        const newSpriteFiles = [...spriteFiles];
                                        newSpriteFiles[index] = {
                                            ...newSpriteFiles[index],
                                            show: !show,
                                        }

                                        setSpriteFiles(newSpriteFiles)
                                    }}
                                />
                                <label htmlFor={`check-${name}`}>
                                    {name} - {cat}
                                </label>
                                <button onClick={() => changeSpritePosition(index, index - 1)} type={'button'}>⬆️
                                </button>
                                <button onClick={() => changeSpritePosition(index, index + 1)} type={'button'}>⬇️️
                                </button>
                            </div>
                        );
                    })}
                    <hr/>
                    <label htmlFor={'spriteName'}>Sprite Name:</label>
                    <input
                        id={'spriteName'}
                        name={'spriteName'}
                        type={'spriteName'}
                        value={spriteName}
                        onChange={(e) => setSpriteName(e.target.value)}
                    />
                    <button onClick={mergeImages} type={'button'}>
                        Save
                    </button>
                    <button onClick={randomize} type={'button'}>
                        Randomize
                    </button>
                    <hr/>
                    {spriteFiles.map(({image, name, show}) => {
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
                                    width: `${spriteSize}px`,
                                    height: `${spriteSize}px`,
                                    transformOrigin: '0px 50%',
                                    backgroundPosition: `${x * spriteSize}px ${y * spriteSize}px`,
                                    zoom: scale,
                                    position: 'absolute',
                                }}
                            />
                        )
                    })}
                </Fragment>
            )}
        </div>
    );
}

export default App;
