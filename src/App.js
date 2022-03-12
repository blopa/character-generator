import { useEffect, useState } from "react";
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
    const [spriteFiles, setSpriteFiles] =  useState([]);

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

    const [x, y] = spritesOrder[currFrame];

    return (
        <div>
            <Dropzone
                onDrop={async acceptedFiles => {
                    const newSprites = [...spriteFiles];
                    for (const acceptedFile of acceptedFiles) {
                        newSprites.push({
                            name: acceptedFile.name,
                            image: await getBase64(acceptedFile),
                            show: true,
                        });
                    }
                    setSpriteFiles(newSprites);
                }}
            >
                {({getRootProps, getInputProps}) => (
                    <section>
                        <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here, or click to select files</p>
                        </div>
                    </section>
                )}
            </Dropzone>
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
            {spriteFiles.map(({ image, name, show }, index) => {
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
                        <label
                            htmlFor={`check-${name}`
                            } >
                            {name}
                        </label>
                    </div>
                );
            })}
            <hr/>
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
                            width: '20px',
                            height: '20px',
                            transformOrigin: '0px 50%',
                            backgroundPosition: `${x * spriteSize}px ${y * spriteSize}px`,
                            zoom: scale,
                            position: 'absolute',
                        }}
                    />
                )
            })}
        </div>
    );
}

export default App;
