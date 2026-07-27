#include <cstdint>

extern "C" {

// Reward scaling for completed mission score.
int32_t compute_reward(int32_t score) {
    int32_t bonus = score * 10;
    if (score > 80) {
        bonus += 200;
    }
    return bonus;
}

// Damage formula for each hit in the 3D arena.
int32_t compute_hit_damage(int32_t hitCount) {
    int32_t baseDamage = 10 + hitCount * 2;
    if (hitCount > 8) {
        baseDamage += 5;
    }
    return baseDamage;
}

}
