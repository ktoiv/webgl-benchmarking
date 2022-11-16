import gsap from "gsap";
import { Vector3, LineCurve3, MathUtils } from "three";
import { setStartTime } from "../state/timing-management";
import { isFullyLoaded } from "../state/state-management";



const animateToCheckpoint = (checkpointPosition, number, controls) => {

    const start = controls.getPosition(new Vector3());
    setStartTime(number);

    const end = checkpointPosition.clone();

    return new Promise((resolve, reject) => {

        const curve = new LineCurve3(start, end)
        const points = curve.getPoints(50);


        const animationProgress = { value: 0 };
        const _tmp = new Vector3();

        const endPoint = points[45];

        const pathAnimation = gsap.fromTo(
            animationProgress,
            {
                value: 0,
            },
            {
                value: 0.89,
                duration: 10,
                paused: true,
                onUpdateParams: [animationProgress],
                onUpdate({ value }) {

                    curve.getPoint(value, _tmp);
                    const cameraX = _tmp.x;
                    const cameraY = _tmp.y;
                    const cameraZ = _tmp.z;
                    const lookAtX = endPoint.x;
                    const lookAtY = endPoint.y;
                    const lookAtZ = endPoint.z;

                    controls.setLookAt(
                        cameraX,
                        cameraY,
                        cameraZ,
                        lookAtX,
                        lookAtY,
                        lookAtZ,
                        false
                    );

                },
                onStart() {
                },
                onComplete() {

                    let times = 0;

                    const intervalId = setInterval(() => {
                        rotateAround(end, controls);

                        if (isFullyLoaded(number)) {
                            times++
                        }

                        if (times === 20) {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }, 1000)
                    
                }
            }
        );

        pathAnimation.play(0);
    });
}


const rotateAround = (point, controls) => {

    return new Promise((resolve, reject) => {
        controls.setOrbitPoint(point.x, point.y, point.z);

        const tween = gsap.fromTo(
            controls,
            {
                azimuthAngle: controls.azimuthAngle,
            },
            {
                azimuthAngle: controls.azimuthAngle + (30 * MathUtils.DEG2RAD),
                duration: 1,
                paused: true,
                onComplete() {
                    resolve();
                }
            }
        );

        tween.play(0);
    })
}


export {animateToCheckpoint};