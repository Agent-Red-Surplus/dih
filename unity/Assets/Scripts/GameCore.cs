using UnityEngine;

public class GameCore : MonoBehaviour
{
    public int clicks = 0;

    public void RegisterClick()
    {
        clicks++;
    }

    void Update()
    {
        // Example: simple logging of clicks per frame (placeholder)
    }
}
