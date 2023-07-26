import { Matrix4, Quaternion, Vector3 } from "three";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";

const tempVec3 = new Vector3(0, 0, 1);
export function useEarthCoordinate() {

  const { inverseTotalRotationMatrix } = storeToRefs(useSEStore())

  // The TwoJS drawing canvas is our assumed XY-plane, and our unit sphere is
  // initially position with its north pole(Z - plus axis) pointing towards the viewer.
  // However, the ThreeJS sphere wrapped with the earth texture shows its north pole
  // pointing up to the sky (our Y-plus axis).
  // Swapping the ycor and zcor below implies a 90-deg rotation around the X-axis
  // to match two two coordinate frames

  function getLocationAtCameraCenter(): number[] {
    tempVec3.set(0, 0, 1) // Reset to Global Z-pos direction
    tempVec3.applyMatrix4(inverseTotalRotationMatrix.value)

    const latRad = Math.asin(tempVec3.y)
    const cosLat = Math.cos(latRad)

    const lngRad = Math.atan2(-tempVec3.z / cosLat, tempVec3.x / cosLat)
    return [latRad.toDegrees(), lngRad.toDegrees()]
  }

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
    console.debug("Fly to", latDegree, lngDegree)
    const FLYOVER_SPEED = 30 // degrees/seconds
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
    const travelTime = rotationAngle.toDegrees() / FLYOVER_SPEED // number of seconds
    const numFrames = travelTime * 1000 / 20 // update interval 20 milliseconds
    const deltaT = 1/numFrames
    const rotationAxis = new Vector3().crossVectors(flyToCoord, frontCoord).normalize()
    // console.debug("Rotate around " + rotationAxis.toFixed(2) + " by " + rotationAngle.toDegrees() + " degrees")

    // Ignore short fly over
    if (Math.abs(rotationAngle.toDegrees()) < 5) return Promise.reject()
    toQuat.setFromAxisAngle(rotationAxis, rotationAngle)
    return new Promise((resolve) => {
      let t = 0;
      const updateTimer = setInterval(() => {
        t += deltaT
        interQuat.slerpQuaternions(fromQuat, toQuat, t)
        tmpMatrix.makeRotationFromQuaternion(interQuat)
        tmpMatrix.invert()
        inverseTotalRotationMatrix.value.copy(tmpMatrix)
        if (t > 1) {
          resolve()
          clearInterval(updateTimer)
        }
      }, 20)
    })
  }
  return {geoLocationToUnitSphere, flyTo, getLocationAtCameraCenter}
}
