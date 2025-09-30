import * as THREE from 'three';
const DilateShader = {
    uniforms: {
        tDiffuse: { value: null },
        u_textureSize: { value: new THREE.Vector2(512, 512) },
    },
    vertexShader: `
     varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      uniform vec2 u_textureSize;

      void main() {
        int MaxSteps = 64;
        vec2 texelsize = 1.0 / u_textureSize;

        float mindist = 1000000.0;
        vec2 offsets[8];
        
        offsets[0] = vec2(-1.0, 0.0);
        offsets[1] = vec2(1.0, 0.0);
        offsets[2] = vec2(0.0, 1.0);
        offsets[3] = vec2(0.0, -1.0);
        offsets[4] = vec2(-1.0, 1.0);
        offsets[5] = vec2(1.0, 1.0);
        offsets[6] = vec2(1.0, -1.0);
        offsets[7] = vec2(-1.0, -1.0);

        vec4 mapSample = texture(tDiffuse, vUv, 0.0);

        vec4 curminsample = mapSample;

        // if (mapSample.x == 0.0 && mapSample.y == 0.0 && mapSample.z==0.0)
        if (mapSample.a==0.0)//for alpha
        {
            for(int i=0; i<64; ++i){
                for(int j=0; j<8; j++){
                    vec2 curUV = vUv + offsets[j] * texelsize * float(i);
                    vec4 offsetsample = texture(tDiffuse, curUV, 0.0);

                    // if (offsetsample.x != 0.0 || offsetsample.y != 0.0 || offsetsample.z != 0.0)
                    if (offsetsample.a == 1.0)
                    {
                        float curdist = length(vUv - curUV);

                        if (curdist < mindist)
                        {
                            vec2 projectUV = curUV + offsets[j] * texelsize * float(i) * 0.25;
                            vec4 direction = texture(tDiffuse, projectUV, 0.0);
                            mindist = curdist;

                            // if (direction.x != 0.0 || direction.y != 0.0 || direction.z != 0.0)
                            if (direction.a == 1.0)
                            {
                                vec4 delta = offsetsample - direction;
                                curminsample = offsetsample + delta * 4.0;
                            }
                            else
                            {
                                curminsample = offsetsample;
                            }
                        }
                    }
                }
            }
        }

        gl_FragColor = curminsample;
    }
    `
};

export { DilateShader };
