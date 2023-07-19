import { Matrix4, Quaternion, Vector3 } from "three";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";

export function useEarthCoordinate() {

  const { inverseTotalRotationMatrix } = storeToRefs(useSEStore())

  function geoLocationToUnitSphere(latDegree: number, lngDegree: number): number[] {
    const latRad = latDegree.toRadians()
    const lngRad = lngDegree.toRadians()
    const xcor = Math.cos(latRad) * Math.cos(lngRad);
    const zcor = -Math.cos(latRad) * Math.sin(lngRad);
    const ycor = Math.sin(latRad);
    return [xcor, ycor, zcor];
  }

  // Rotate the earth to bring the desired geo location to the front view
  function flyTo(latDegree: number, lngDegree: number): Promise<void> {
    const frontCoord = new Vector3()
    frontCoord.set(0, 0, 1)
    frontCoord.applyMatrix4(inverseTotalRotationMatrix.value)
    const flyToCoord = new Vector3().fromArray(geoLocationToUnitSphere(latDegree, lngDegree))
    console.debug("From " + frontCoord.toFixed(2) + " to " + flyToCoord.toFixed(2))

    const tmpVector = new Vector3()
    const fromQuat = new Quaternion()
    const toQuat = new Quaternion()
    const interQuat = new Quaternion()

    // Determine initial quaternion
    const tmpMatrix = new Matrix4()
    tmpMatrix.copy(inverseTotalRotationMatrix.value).invert()
    tmpMatrix.decompose(tmpVector, fromQuat, tmpVector)

    // Determine final quaternion
    const rotationAngle = flyToCoord.distanceTo(frontCoord)

    const rotationAxis = new Vector3().crossVectors(flyToCoord, frontCoord).normalize()
    console.debug("Rotate around " + rotationAxis.toFixed(2) + " by " + rotationAngle.toDegrees() + " degrees")
    if (Math.abs(rotationAngle.toDegrees()) < 5) return Promise.reject()
    toQuat.setFromAxisAngle(rotationAxis, rotationAngle)
    return new Promise((resolve) => {
      let t = 0;
      const updateTimer = setInterval(() => {
        t += 0.01
        interQuat.slerpQuaternions(fromQuat, toQuat, t)
        tmpMatrix.makeRotationFromQuaternion(interQuat)
        tmpMatrix.invert()
        inverseTotalRotationMatrix.value.copy(tmpMatrix)
        if (t > 1) {
          resolve()
          clearInterval(updateTimer)
        }
      }, 16)
    })
  }
  return {geoLocationToUnitSphere, flyTo}
}
