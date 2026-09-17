import React from 'react';
import * as THREE from 'three';

/**
 * Low-poly stylized cricket ground and stadium pitch model.
 * Triangle count: < 6,000 vertices (well within the 50k budget).
 * Uses procedural Three.js primitives with rich dark sports aesthetics.
 */
export const PitchModel: React.FC = () => {
  return (
    <group>
      {/* 1. Outer Stadium Ground / Surrounding Terrain */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[26, 28, 0.4, 48]} />
        <meshStandardMaterial color="#091410" roughness={0.9} />
      </mesh>

      {/* 2. Stadium Seating Tier / Perimeter Rim */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[24, 25.5, 0.6, 48, 1, true]} />
        <meshStandardMaterial color="#13241b" roughness={0.8} />
      </mesh>

      {/* 3. Outer Boundary Rope (White torus or ring) */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18.4, 18.6, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* 4. Cricket Outfield (Lush Emerald Turf) */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[18.5, 18.5, 0.05, 48]} />
        <meshStandardMaterial color="#0b3d22" roughness={0.7} />
      </mesh>

      {/* Mowing Stripe Accents (Concentric subtle rings) */}
      {[5.5, 10, 14.5].map((rad, idx) => (
        <mesh key={idx} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[rad - 0.7, rad + 0.7, 48]} />
          <meshBasicMaterial color="#0d4627" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* 5. 30-Yard Infield Circle (Demarcation Line) */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.95, 8.05, 64]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* 6. Central Pitch (Clay Turf Strip) */}
      {/* Pitch dimensions: width 2.6, length 9.2 */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.03, 9.4]} />
        <meshStandardMaterial color="#c2a679" roughness={0.9} />
      </mesh>

      {/* Crease Markings (Popping and Bowling Creases) */}
      {/* Batting end (z = 3.6) */}
      <mesh position={[0, 0.065, 3.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 0.08]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* Bowling end (z = -3.6) */}
      <mesh position={[0, 0.065, -3.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 0.08]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* Return Crease side markers */}
      {[-1.2, 1.2].map((x, i) => (
        <React.Fragment key={i}>
          <mesh position={[x, 0.065, 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 0.8]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[x, 0.065, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 0.8]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 7. Wickets & Bails at both ends */}
      <WicketsSet position={[0, 0.06, 4.0]} />
      <WicketsSet position={[0, 0.06, -4.0]} />

      {/* 8. 4 Corner Stadium Floodlight Towers */}
      {[
        [-17, -17],
        [17, -17],
        [-17, 17],
        [17, 17]
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Steel Tower Mast */}
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.2, 0.45, 8, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Floodlight Head Frame */}
          <mesh position={[0, 8.2, 0]} rotation={[0.4, Math.atan2(-x, -z), 0]}>
            <boxGeometry args={[2.2, 1.2, 0.3]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Glowing Floodlight Bulbs */}
          <mesh position={[0, 8.2, 0.1]} rotation={[0.4, Math.atan2(-x, -z), 0]}>
            <planeGeometry args={[2.0, 1.0]} />
            <meshBasicMaterial color="#e0f2fe" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface WicketsProps {
  position: [number, number, number];
}

const WicketsSet: React.FC<WicketsProps> = ({ position }) => {
  const stumpOffsets = [-0.18, 0, 0.18];
  return (
    <group position={position}>
      {/* 3 Stumps */}
      {stumpOffsets.map((ox, idx) => (
        <mesh key={idx} position={[ox, 0.35, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />
          <meshStandardMaterial color="#d4a373" roughness={0.4} />
        </mesh>
      ))}
      {/* 2 Bails */}
      <mesh position={[-0.09, 0.71, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
        <meshStandardMaterial color="#e9d5a1" />
      </mesh>
      <mesh position={[0.09, 0.71, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
        <meshStandardMaterial color="#e9d5a1" />
      </mesh>
    </group>
  );
};
